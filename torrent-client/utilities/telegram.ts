import path from 'node:path';

import { Torrent, TorrentFile, TorrentState } from '@prisma/client';
import groupBy from 'lodash/groupBy';
import map from 'lodash/map';
import sortBy from 'lodash/sortBy';
import { InlineKeyboardMarkup } from 'node-telegram-bot-api';
import torrentClient from 'torrent-client';
import { Torrent as ClientTorrent } from 'webtorrent';

import prisma from 'db/prisma';

import { CallbackButtonSource } from 'types/telegram';

import CustomError from 'utilities/CustomError';
import { isDefined } from 'utilities/is';
import { formatPercent, formatProgress, minmax } from 'utilities/number';
import { formatSize, formatSpeed, getProgress, getRealProgress } from 'utilities/size';
import { prepareInlineKeyboard } from 'utilities/telegram';

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

export interface TelegramStatus {
  status: string;
  keyboard: InlineKeyboardMarkup;
}

// TODO: add keyboard (settings, pause, set limits)
export async function getTelegramStatus(): Promise<TelegramStatus> {
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

  let statusString = '';

  if (clientState.paused) {
    statusString += `🟠 Клиент стоит на паузе

`;
  }

  statusString += `Скорость загрузки: ${formatSpeed(downloadSpeed)}${
    clientState.downloadSpeedLimit === null ? '' : ` (ограничение: ${formatSpeed(clientState.downloadSpeedLimit)})`
  }
Скорость отдачи: ${formatSpeed(uploadSpeed)}${
    clientState.uploadSpeedLimit === null ? '' : ` (ограничение: ${formatSpeed(clientState.uploadSpeedLimit)})`
  }

`;

  statusString += (await formatTorrents(notFinishedTorrents)) || 'Нет активных торрентов';

  return {
    status: statusString,
    keyboard: prepareInlineKeyboard([
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
    ]),
  };
}

export interface TorrentsListInfo {
  info: string;
  keyboard: InlineKeyboardMarkup;
}

// TODO: add add button
export async function getTelegramTorrentsListInfo(page: number = 0): Promise<TorrentsListInfo> {
  const torrents = await prisma.torrent.findMany();
  const sortedTorrents = sortTorrents(torrents);

  const start = page * LIST_PAGE_SIZE;
  const end = start + LIST_PAGE_SIZE;

  const pageTorrents = sortedTorrents.slice(start, end);

  const hasPrevButton = start > 0;
  const hastNextButton = end < sortedTorrents.length;

  return {
    info: (await formatTorrents(pageTorrents)) || 'Нет торрентов',
    keyboard: prepareInlineKeyboard(
      [
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
    ),
  };
}

export interface TorrentInfo {
  info: string;
  keyboard: InlineKeyboardMarkup;
}

export async function getTelegramTorrentInfo(
  infoHash: string,
  withDeleteConfirm: boolean = false,
): Promise<TorrentInfo> {
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
      ? `
Проверено: ${formatPercent(minmax(getProgress(clientTorrent) / torrent.progress, 0, 1))}`
      : '';

  const info = `
Название: ${torrent.name}
Статус: ${STATE_TITLE[torrent.state]}
Размер: ${formatSize(torrent.size)}
Скачано: ${formatPercent(progress)}${verifiedString}

${files.map((file) => formatTorrentFile(file, { torrent, clientTorrent })).join('\n\n')}
`;

  const isPausedOrError = torrent.state === 'Paused' || torrent.state === 'Error';
  const isCritical = clientState.criticalTorrentId === infoHash;

  return {
    info: info.trim(),
    keyboard: prepareInlineKeyboard(
      [
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
    ),
  };
}

export function sortTorrents(torrents: Torrent[]): Torrent[] {
  return sortBy(torrents, ({ state }) => STATUS_STATE_SORTING[state]);
}

export async function formatTorrents(torrents: Torrent[]): Promise<string> {
  const sortedTorrents = sortTorrents(torrents);
  const groupedTorrents = groupBy(sortedTorrents, ({ state }) => state);

  const formattedGroups = await Promise.all(
    map(groupedTorrents, async (torrents, groupString) => {
      const filesStrings = await Promise.all(torrents.map(formatTorrentsListItem));

      return `${STATE_TITLE[groupString as TorrentState]}
${filesStrings.join('\n')}`;
    }),
  );

  return formattedGroups.join('\n\n');
}

export async function formatTorrentsListItem(torrent: Torrent): Promise<string> {
  const [clientTorrent, clientState] = await Promise.all([
    torrentClient.getClientTorrent(torrent.infoHash),
    torrentClient.getState(),
  ]);
  const progress = getRealProgress(torrent, torrent, clientTorrent);

  return `${clientState.criticalTorrentId === torrent.infoHash ? '❗️ ' : ''}${
    torrent.name ?? 'Неизвестно'
  } (${formatSize(torrent.size)}, ${formatPercent(progress)})`;
}

export interface FormatTorrentFileOptions {
  torrent: Torrent;
  clientTorrent: ClientTorrent | null;
}

export function formatTorrentFile(file: TorrentFile, options: FormatTorrentFileOptions): string {
  const { torrent, clientTorrent } = options;

  const clientTorrentFile = clientTorrent?.files.find(({ path }) => path === file.path);
  const progress = getRealProgress(file, torrent, clientTorrentFile);

  return `${file.path === torrent.name ? file.path : path.relative(torrent.name ?? '', file.path)}
${formatProgress(progress)}
${formatSize(file.size)}, ${formatPercent(progress)}`;
}
