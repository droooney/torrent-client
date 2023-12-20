import path from 'node:path';

import { Torrent, TorrentFile, TorrentState } from '@prisma/client';
import chunk from 'lodash/chunk';
import groupBy from 'lodash/groupBy';
import map from 'lodash/map';
import sortBy from 'lodash/sortBy';
import torrentClient from 'torrent-client/client';
import { Torrent as ClientTorrent } from 'webtorrent';

import prisma from 'db/prisma';

import { CallbackButtonSource } from 'telegram-bot/types/keyboard';

import DeferredResponse from 'telegram-bot/utilities/DeferredResponse';
import Markdown from 'telegram-bot/utilities/Markdown';
import Response from 'telegram-bot/utilities/Response';
import rutrackerClient from 'telegram-bot/utilities/RutrackerClient';
import CustomError from 'utilities/CustomError';
import { isDefined } from 'utilities/is';
import { formatIndex, formatPercent, formatProgress, minmax } from 'utilities/number';
import { formatSize, formatSpeed, getProgress, getRealProgress } from 'utilities/size';

const STATUS_STATE_SORTING: { [State in TorrentState]: number } = {
  Downloading: 0,
  Verifying: 1,
  Queued: 2,
  Paused: 3,
  Error: 4,
  Finished: 5,
};

const STATE_TITLE: { [State in TorrentState]: string } = {
  Downloading: '🟢 Скачивается',
  Verifying: '🟡 Проверяется',
  Queued: '🔵 В очереди',
  Paused: '🟠 На паузе',
  Error: '🔴 Ошибка',
  Finished: '⚪️ Завершен',
};

const LIST_PAGE_SIZE = 6;

export function getErrorResponse(err: unknown): Response {
  return new Response({
    text: err instanceof CustomError ? err.message : 'Произошла ошибка',
  });
}

export async function getAddTorrentResponse(getTorrent: () => Promise<Torrent | null>): Promise<DeferredResponse> {
  return new DeferredResponse({
    immediate: new Response({
      text: 'Торрент добавляется...',
    }),
    async getDeferred() {
      const torrent = await getTorrent();

      if (!torrent) {
        return new Response({
          text: 'Данные торрента отсутствуют',
        });
      }

      return new Response({
        text: Markdown.create`Торрент${torrent.name ? Markdown.create` "${torrent.name}"` : ''} добавлен!`,
        keyboard: [
          [
            {
              type: 'callback',
              text: '▶️ Подробнее',
              callbackData: {
                source: CallbackButtonSource.NAVIGATE_TO_TORRENT,
                torrentId: torrent.infoHash,
              },
            },
          ],
        ],
      });
    },
  });
}

export async function getSearchRutrackerResponse(text: string): Promise<DeferredResponse> {
  return new DeferredResponse({
    immediate: new Response({
      text: Markdown.create`Запущен поиск на rutracker по строке "${text}"...`,
    }),
    async getDeferred() {
      const torrents = await rutrackerClient.search(text);
      const topTorrents = torrents.slice(0, 10);

      if (!torrents.length) {
        return new Response({
          text: 'Результатов не найдено',
        });
      }

      return new Response({
        text: Markdown.join(
          topTorrents.map(
            ({ title, author, seeds, size }, index) => Markdown.create`${Markdown.bold('Название')}: ${formatIndex(
              index,
            )} ${title}
${Markdown.bold('Автор')}: ${author}
${Markdown.bold('Размер')}: ${formatSize(size)}
${Markdown.bold('Сидов')}: ${seeds}
`,
          ),
          '\n\n',
        ),
        keyboard: chunk(
          topTorrents.map(({ id }, index) => ({
            type: 'callback',
            text: formatIndex(index),
            callbackData: {
              source: CallbackButtonSource.RUTRACKER_SEARCH_ADD_TORRENT,
              torrentId: id,
            },
          })),
          3,
        ),
      });
    },
  });
}

// TODO: add keyboard (settings, set limits)
export async function getTelegramStatusResponse(): Promise<Response> {
  const [clientState, downloadSpeed, uploadSpeed, notFinishedTorrents] = await Promise.all([
    torrentClient.getState(),
    torrentClient.getDownloadSpeed(),
    torrentClient.getUploadSpeed(),
    prisma.torrent.findMany({
      where: {
        state: {
          not: 'Finished',
        },
      },
    }),
  ]);

  const status = new Markdown();

  if (clientState.paused) {
    status.add`🟠 Клиент стоит на паузе

`;
  }

  status.add`Скорость загрузки: ${formatSpeed(downloadSpeed)}${
    clientState.downloadSpeedLimit !== null &&
    Markdown.create` (ограничение: ${formatSpeed(clientState.downloadSpeedLimit)})`
  }
Скорость отдачи: ${formatSpeed(uploadSpeed)}${
    clientState.uploadSpeedLimit !== null &&
    Markdown.create` (ограничение: ${formatSpeed(clientState.uploadSpeedLimit)})`
  }

`;

  const notFinishedTorrentsText = await formatTorrents(notFinishedTorrents);

  status.add`${notFinishedTorrentsText.isEmpty() ? 'Нет активных торрентов' : notFinishedTorrentsText}`;

  return new Response({
    text: status,
    keyboard: [
      [
        {
          type: 'callback',
          text: '🔄 Обновить',
          callbackData: {
            source: CallbackButtonSource.STATUS_REFRESH,
          },
        },
      ],
      [
        {
          type: 'callback',
          text: clientState.paused ? '▶️ Продолжить' : '⏸ Пауза',
          callbackData: {
            source: CallbackButtonSource.STATUS_PAUSE,
            pause: !clientState.paused,
          },
        },
      ],
    ],
  });
}

// TODO: add add button
export async function getTelegramTorrentsListResponse(page: number = 0): Promise<Response> {
  const torrents = await prisma.torrent.findMany();
  const sortedTorrents = sortTorrents(torrents);

  const start = page * LIST_PAGE_SIZE;
  const end = start + LIST_PAGE_SIZE;

  const pageTorrents = sortedTorrents.slice(start, end);

  const hasPrevButton = start > 0;
  const hastNextButton = end < sortedTorrents.length;

  const text = await formatTorrents(pageTorrents);

  return new Response({
    text: text.isEmpty() ? 'Нет торрентов' : text,
    keyboard: [
      [
        {
          type: 'callback',
          text: '🔄 Обновить',
          callbackData: {
            source: CallbackButtonSource.TORRENTS_LIST_REFRESH,
            page,
          },
        } as const,
      ],
      ...pageTorrents.map((torrent) => [
        {
          type: 'callback',
          text: torrent.name ?? 'Неизвестно',
          callbackData: {
            source: CallbackButtonSource.TORRENTS_LIST_ITEM,
            torrentId: torrent.infoHash,
          },
        } as const,
      ]),
      hasPrevButton || hastNextButton
        ? [
            hasPrevButton
              ? ({
                  type: 'callback',
                  text: '◀️',
                  callbackData: {
                    source: CallbackButtonSource.TORRENTS_LIST_PAGE,
                    page: page - 1,
                  },
                } as const)
              : null,
            hastNextButton
              ? ({
                  type: 'callback',
                  text: '▶️',
                  callbackData: {
                    source: CallbackButtonSource.TORRENTS_LIST_PAGE,
                    page: page + 1,
                  },
                } as const)
              : null,
          ].filter(isDefined)
        : null,
    ].filter(isDefined),
  });
}

export async function getTelegramTorrentInfo(infoHash: string, withDeleteConfirm: boolean = false): Promise<Response> {
  const [clientState, torrent, files, clientTorrent] = await Promise.all([
    torrentClient.getState(),
    prisma.torrent.findUnique({
      where: {
        infoHash,
      },
    }),
    prisma.torrentFile.findMany({
      where: {
        torrentId: infoHash,
      },
      orderBy: {
        path: 'asc',
      },
    }),
    torrentClient.getClientTorrent(infoHash),
  ]);

  if (!torrent) {
    throw new CustomError('Торрент не найден');
  }

  const progress = getRealProgress(torrent, torrent, clientTorrent);
  const verifiedString =
    torrent.state === 'Verifying' && clientTorrent
      ? Markdown.create`
${Markdown.bold('Проверено')}: ${formatPercent(minmax(getProgress(clientTorrent) / torrent.progress || 0, 0, 1))}`
      : '';

  // TODO: show remaining time
  const info = Markdown.create`
${Markdown.bold('Название')}: ${torrent.name}
${Markdown.bold('Статус')}: ${STATE_TITLE[torrent.state]}
${Markdown.bold('Размер')}: ${formatSize(torrent.size)}
${Markdown.bold('Скачано')}: ${formatPercent(progress)}${verifiedString}

${Markdown.join(
  files.map((file) => formatTorrentFile(file, { torrent, clientTorrent })),
  '\n\n',
)}
`;

  const isPausedOrError = torrent.state === 'Paused' || torrent.state === 'Error';
  const isCritical = clientState.criticalTorrentId === infoHash;

  return new Response({
    text: info,
    keyboard: [
      torrent.state === 'Finished'
        ? null
        : [
            {
              type: 'callback',
              text: '🔄 Обновить',
              callbackData: {
                source: CallbackButtonSource.TORRENT_REFRESH,
                torrentId: infoHash,
              },
            } as const,
            {
              type: 'callback',
              text: isCritical ? '❕ Сделать некритичным' : '❗️ Сделать критичным',
              callbackData: {
                source: CallbackButtonSource.TORRENT_SET_CRITICAL,
                torrentId: infoHash,
                critical: !isCritical,
              },
            } as const,
          ],
      [
        torrent.state === 'Finished'
          ? null
          : ({
              type: 'callback',
              text: isPausedOrError ? '▶️ Продолжить' : '⏸ Пауза',
              callbackData: {
                source: CallbackButtonSource.TORRENT_PAUSE,
                torrentId: infoHash,
                pause: !isPausedOrError,
              },
            } as const),
        withDeleteConfirm
          ? ({
              type: 'callback',
              text: '❌ Точно удалить?',
              callbackData: {
                source: CallbackButtonSource.TORRENT_DELETE_CONFIRM,
                torrentId: infoHash,
              },
            } as const)
          : ({
              type: 'callback',
              text: '❌ Удалить',
              callbackData: {
                source: CallbackButtonSource.TORRENT_DELETE,
                torrentId: infoHash,
              },
            } as const),
      ].filter(isDefined),
      [
        {
          type: 'callback',
          text: '◀️ К списку',
          callbackData: {
            source: CallbackButtonSource.TORRENT_BACK_TO_LIST,
          },
        } as const,
      ],
    ].filter(isDefined),
  });
}

export function sortTorrents(torrents: Torrent[]): Torrent[] {
  return sortBy(torrents, ({ state }) => STATUS_STATE_SORTING[state]);
}

export async function formatTorrents(torrents: Torrent[]): Promise<Markdown> {
  const sortedTorrents = sortTorrents(torrents);
  const groupedTorrents = groupBy(sortedTorrents, ({ state }) => state);

  const formattedGroups = await Promise.all(
    map(groupedTorrents, async (torrents, groupString) => {
      const filesStrings = await Promise.all(torrents.map(formatTorrentsListItem));

      return Markdown.create`${Markdown.bold(STATE_TITLE[groupString as TorrentState])}
${Markdown.join(filesStrings, '\n')}`;
    }),
  );

  return Markdown.join(formattedGroups, '\n\n');
}

export async function formatTorrentsListItem(torrent: Torrent): Promise<Markdown> {
  const [clientTorrent, clientState] = await Promise.all([
    torrentClient.getClientTorrent(torrent.infoHash),
    torrentClient.getState(),
  ]);
  const progress = getRealProgress(torrent, torrent, clientTorrent);

  return Markdown.create`${clientState.criticalTorrentId === torrent.infoHash ? '❗️ ' : ''}${
    torrent.name ?? 'Неизвестно'
  } (${formatSize(torrent.size)}, ${formatPercent(progress)})`;
}

export interface FormatTorrentFileOptions {
  torrent: Torrent;
  clientTorrent: ClientTorrent | null;
}

export function formatTorrentFile(file: TorrentFile, options: FormatTorrentFileOptions): Markdown {
  const { torrent, clientTorrent } = options;

  const clientTorrentFile = clientTorrent?.files.find(({ path }) => path === file.path);
  const progress = getRealProgress(file, torrent, clientTorrentFile);

  return Markdown.create`${file.path === torrent.name ? file.path : path.relative(torrent.name ?? '', file.path)}
${formatProgress(progress)}
${formatSize(file.size)}, ${formatPercent(progress)}`;
}
