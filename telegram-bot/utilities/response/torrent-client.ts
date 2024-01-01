import path from 'node:path';

import { Torrent, TorrentFile, TorrentFileState, TorrentState } from '@prisma/client';
import chunk from 'lodash/chunk';
import sortBy from 'lodash/sortBy';
import torrentClient from 'torrent-client/client';
import { Torrent as ClientTorrent } from 'webtorrent';

import prisma from 'db/prisma';

import { CallbackButtonSource } from 'telegram-bot/types/keyboard';

import DeferredResponse from 'telegram-bot/utilities/DeferredResponse';
import Markdown from 'telegram-bot/utilities/Markdown';
import Response from 'telegram-bot/utilities/Response';
import rutrackerClient from 'telegram-bot/utilities/RutrackerClient';
import TorrentClient from 'torrent-client/utilities/TorrentClient';
import CustomError, { ErrorCode } from 'utilities/CustomError';
import { formatDuration } from 'utilities/date';
import { getFileIcon } from 'utilities/file';
import { isDefined } from 'utilities/is';
import { formatIndex, formatPercent, formatProgress, minmax } from 'utilities/number';
import { formatSize, formatSpeed } from 'utilities/size';

const STATUS_STATE_SORTING: Record<TorrentState, number> = {
  [TorrentState.Downloading]: 0,
  [TorrentState.Verifying]: 1,
  [TorrentState.Queued]: 2,
  [TorrentState.Paused]: 3,
  [TorrentState.Error]: 4,
  [TorrentState.Finished]: 5,
};

const STATE_TITLE: Record<TorrentState, string> = {
  [TorrentState.Downloading]: '🟢 Скачивается',
  [TorrentState.Verifying]: '🟡 Проверяется',
  [TorrentState.Queued]: '🔵 В очереди',
  [TorrentState.Paused]: '🟠 На паузе',
  [TorrentState.Error]: '🔴 Ошибка',
  [TorrentState.Finished]: '⚪️ Завершен',
};

const LIST_PAGE_SIZE = 5;

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
                source: CallbackButtonSource.TORRENT_CLIENT_NAVIGATE_TO_TORRENT,
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
              source: CallbackButtonSource.TORRENT_CLIENT_RUTRACKER_SEARCH_ADD_TORRENT,
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
export async function getStatusResponse(): Promise<Response> {
  const [clientState, downloadSpeed, uploadSpeed, notFinishedTorrents] = await Promise.all([
    torrentClient.getState(),
    torrentClient.getDownloadSpeed(),
    torrentClient.getUploadSpeed(),
    prisma.torrent.findMany({
      where: {
        state: {
          in: [TorrentState.Verifying, TorrentState.Downloading],
        },
      },
    }),
  ]);

  const status = new Markdown();

  if (clientState.paused) {
    status.add`🟠 Клиент стоит на паузе

`;
  }

  status.add`${Markdown.bold('Скорость загрузки')}: ${formatSpeed(downloadSpeed)}${
    clientState.downloadSpeedLimit !== null &&
    Markdown.create` (ограничение: ${formatSpeed(clientState.downloadSpeedLimit)})`
  }
${Markdown.bold('Скорость отдачи')}: ${formatSpeed(uploadSpeed)}${
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
            source: CallbackButtonSource.TORRENT_CLIENT_STATUS_REFRESH,
          },
        },
        {
          type: 'callback',
          text: clientState.paused ? '▶️ Продолжить' : '⏸ Пауза',
          callbackData: {
            source: CallbackButtonSource.TORRENT_CLIENT_STATUS_PAUSE,
            pause: !clientState.paused,
          },
        },
      ],
      [
        {
          type: 'callback',
          text: '➕ Добавить',
          callbackData: {
            source: CallbackButtonSource.TORRENT_CLIENT_ADD_TORRENT,
          },
        },
        {
          type: 'callback',
          text: '📜 Список',
          callbackData: {
            source: CallbackButtonSource.TORRENT_CLIENT_STATUS_SHOW_TORRENTS_LIST,
          },
        },
      ],
      [
        {
          type: 'callback',
          text: '◀️ Назад',
          callbackData: {
            source: CallbackButtonSource.ROOT_BACK_TO_ROOT,
          },
        },
      ],
    ],
  });
}

export async function getTelegramTorrentsListResponse(page: number = 0): Promise<Response> {
  // TODO: better pagination
  const torrents = await prisma.torrent.findMany({
    orderBy: {
      createdAt: 'desc',
    },
  });
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
            source: CallbackButtonSource.TORRENT_CLIENT_TORRENTS_LIST_REFRESH,
            page,
          },
        },
      ],
      ...pageTorrents.map((torrent) => [
        {
          type: 'callback',
          text: torrent.name ?? 'Неизвестно',
          callbackData: {
            source: CallbackButtonSource.TORRENT_CLIENT_TORRENTS_LIST_ITEM,
            torrentId: torrent.infoHash,
          },
        } as const,
      ]),
      [
        hasPrevButton && {
          type: 'callback',
          text: '◀️',
          callbackData: {
            source: CallbackButtonSource.TORRENT_CLIENT_TORRENTS_LIST_PAGE,
            page: page - 1,
          },
        },
        hastNextButton && {
          type: 'callback',
          text: '▶️',
          callbackData: {
            source: CallbackButtonSource.TORRENT_CLIENT_TORRENTS_LIST_PAGE,
            page: page + 1,
          },
        },
      ],
      [
        {
          type: 'callback',
          text: '◀️ Назад',
          callbackData: {
            source: CallbackButtonSource.TORRENT_CLIENT_BACK_TO_STATUS,
          },
        },
      ],
    ],
  });
}

export async function getTelegramTorrentInfo(infoHash: string, withDeleteConfirm: boolean = false): Promise<Response> {
  const [clientState, torrent] = await Promise.all([
    torrentClient.getState(),
    prisma.torrent.findUnique({
      where: {
        infoHash,
      },
    }),
  ]);

  if (!torrent) {
    throw new CustomError(ErrorCode.NOT_FOUND, 'Торрент не найден');
  }

  const isPausedOrError = torrent.state === TorrentState.Paused || torrent.state === TorrentState.Error;
  const isCritical = clientState.criticalTorrentId === infoHash;

  return new Response({
    text: await formatTorrent(torrent),
    keyboard: [
      torrent.state !== TorrentState.Finished && [
        {
          type: 'callback',
          text: '🔄 Обновить',
          callbackData: {
            source: CallbackButtonSource.TORRENT_CLIENT_TORRENT_REFRESH,
            torrentId: infoHash,
          },
        },
        {
          type: 'callback',
          text: isCritical ? '❕ Сделать некритичным' : '❗️ Сделать критичным',
          callbackData: {
            source: CallbackButtonSource.TORRENT_CLIENT_TORRENT_SET_CRITICAL,
            torrentId: infoHash,
            critical: !isCritical,
          },
        },
      ],
      [
        torrent.state !== TorrentState.Finished && {
          type: 'callback',
          text: isPausedOrError ? '▶️ Продолжить' : '⏸ Пауза',
          callbackData: {
            source: CallbackButtonSource.TORRENT_CLIENT_TORRENT_PAUSE,
            torrentId: infoHash,
            pause: !isPausedOrError,
          },
        },
        withDeleteConfirm
          ? {
              type: 'callback',
              text: '🗑 Точно удалить?',
              callbackData: {
                source: CallbackButtonSource.TORRENT_CLIENT_TORRENT_DELETE_CONFIRM,
                torrentId: infoHash,
              },
            }
          : {
              type: 'callback',
              text: '🗑 Удалить',
              callbackData: {
                source: CallbackButtonSource.TORRENT_CLIENT_TORRENT_DELETE,
                torrentId: infoHash,
              },
            },
      ],
      [
        {
          type: 'callback',
          text: '📄 Файлы',
          callbackData: {
            source: CallbackButtonSource.TORRENT_CLIENT_TORRENT_SHOW_FILES,
            torrentId: infoHash,
          },
        },
      ],
      [
        {
          type: 'callback',
          text: '◀️ К списку',
          callbackData: {
            source: CallbackButtonSource.TORRENT_CLIENT_TORRENT_BACK_TO_LIST,
          },
        },
      ],
    ],
  });
}

export async function getFilesResponse(infoHash: string, page: number = 0): Promise<Response> {
  // TODO: better pagination
  const [torrent, files, clientTorrent] = await Promise.all([
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
    throw new CustomError(ErrorCode.NOT_FOUND, 'Торрент не найден');
  }

  const start = page * LIST_PAGE_SIZE;
  const end = start + LIST_PAGE_SIZE;

  const pageFiles = files.slice(start, end);

  const hasPrevButton = start > 0;
  const hastNextButton = end < files.length;

  return new Response({
    text: formatTorrentFiles(pageFiles, {
      torrent,
      clientTorrent,
    }),
    keyboard: [
      [
        {
          type: 'callback',
          text: '🔄 Обновить',
          callbackData: {
            source: CallbackButtonSource.TORRENT_CLIENT_TORRENT_FILES_REFRESH,
            torrentId: infoHash,
            page,
          },
        },
      ],
      ...chunk(
        pageFiles.map(
          ({ id }, index) =>
            ({
              type: 'callback',
              text: formatIndex(index),
              callbackData: {
                source: CallbackButtonSource.TORRENT_CLIENT_TORRENT_NAVIGATE_TO_FILE,
                fileId: id,
              },
            }) as const,
        ),
        3,
      ),
      [
        hasPrevButton && {
          type: 'callback',
          text: '◀️',
          callbackData: {
            source: CallbackButtonSource.TORRENT_CLIENT_TORRENT_FILES_PAGE,
            torrentId: infoHash,
            page: page - 1,
          },
        },
        hastNextButton && {
          type: 'callback',
          text: '▶️',
          callbackData: {
            source: CallbackButtonSource.TORRENT_CLIENT_TORRENT_FILES_PAGE,
            torrentId: infoHash,
            page: page + 1,
          },
        },
      ],
      [
        {
          type: 'callback',
          text: '◀️ К торренту',
          callbackData: {
            source: CallbackButtonSource.TORRENT_CLIENT_BACK_TO_TORRENT,
            torrentId: infoHash,
          },
        },
      ],
    ],
  });
}

export async function getFileResponse(fileId: number, withDeleteConfirm: boolean = false): Promise<Response> {
  const file = await prisma.torrentFile.findUnique({
    where: {
      id: fileId,
    },
  });

  if (!file) {
    throw new CustomError(ErrorCode.NOT_FOUND, 'Файл не найден');
  }

  const [torrent, clientTorrent] = await Promise.all([
    prisma.torrent.findUnique({
      where: {
        infoHash: file.torrentId,
      },
    }),
    torrentClient.getClientTorrent(file.torrentId),
  ]);

  if (!torrent) {
    throw new CustomError(ErrorCode.NOT_FOUND, 'Торрент не найден');
  }

  return new Response({
    text: formatTorrentFile(file, {
      torrent,
      clientTorrent,
    }),
    keyboard: [
      file.state !== TorrentFileState.Finished && [
        {
          type: 'callback',
          text: '🔄 Обновить',
          callbackData: {
            source: CallbackButtonSource.TORRENT_FILE_REFRESH,
            fileId,
          },
        },
      ],
      file.state === TorrentFileState.Finished && [
        withDeleteConfirm
          ? {
              type: 'callback',
              text: '🗑 Точно удалить?',
              callbackData: {
                source: CallbackButtonSource.TORRENT_CLIENT_DELETE_FILE_CONFIRM,
                fileId,
              },
            }
          : {
              type: 'callback',
              text: '🗑 Удалить',
              callbackData: {
                source: CallbackButtonSource.TORRENT_CLIENT_DELETE_FILE,
                fileId,
              },
            },
      ],
      [
        {
          type: 'callback',
          text: '◀️ К файлам',
          callbackData: {
            source: CallbackButtonSource.TORRENT_CLIENT_BACK_TO_FILES,
            torrentId: file.torrentId,
          },
        },
      ],
    ],
  });
}

export function sortTorrents(torrents: Torrent[]): Torrent[] {
  return sortBy(torrents, ({ state }) => STATUS_STATE_SORTING[state]);
}

export async function formatTorrents(torrents: Torrent[]): Promise<Markdown> {
  const sortedTorrents = sortTorrents(torrents);
  const formattedTorrents = await Promise.all(sortedTorrents.map(formatTorrent));

  return Markdown.join(formattedTorrents, '\n\n');
}

export async function formatTorrent(torrent: Torrent): Promise<Markdown> {
  const [clientTorrent, clientState, downloadSpeed] = await Promise.all([
    torrentClient.getClientTorrent(torrent.infoHash),
    torrentClient.getState(),
    torrentClient.getDownloadSpeed(),
  ]);
  const progress = TorrentClient.getRealProgress(torrent, torrent, clientTorrent);

  const text = Markdown.create`🅰️ ${Markdown.bold('Название')}: ${
    clientState.criticalTorrentId === torrent.infoHash ? '❗️ ' : ''
  }${torrent.name ?? 'Неизвестно'}
⚫️ ${Markdown.bold('Статус')}: ${STATE_TITLE[torrent.state]}
💾 ${Markdown.bold('Размер')}: ${formatSize(torrent.size)}`;

  if (torrent.state !== TorrentState.Finished) {
    text.add`
💯 ${Markdown.bold('Прогресс')}: ${formatProgress(progress)} ${formatPercent(progress)}`;
  }

  if (torrent.state === TorrentState.Downloading && clientTorrent) {
    text.add`
⏳ ${Markdown.bold('Осталось')}: ${formatDuration(clientTorrent.timeRemaining)}
⚡️ ${Markdown.bold('Скорость загрузки')}: ${formatSpeed(downloadSpeed)}`;
  }

  if (torrent.state === TorrentState.Verifying && clientTorrent) {
    const verifiedProgress = minmax(TorrentClient.getProgress(clientTorrent) / torrent.progress || 0, 0, 1);

    text.add`
⚠️ ${Markdown.bold('Проверено')}: ${formatProgress(verifiedProgress)} ${formatPercent(verifiedProgress)}`;
  }

  if (torrent.state === 'Error' && torrent.errorMessage) {
    text.add`
${Markdown.bold('Ошибка')}: ${torrent.errorMessage}`;
  }

  return text;
}

export interface FormatTorrentFilesOptions {
  torrent: Torrent;
  clientTorrent: ClientTorrent | null;
}

export function formatTorrentFiles(files: TorrentFile[], options: FormatTorrentFilesOptions): Markdown {
  return Markdown.join(
    files.map((file, index) => formatTorrentFile(file, { ...options, index })),
    '\n\n',
  );
}

export interface FormatTorrentFileOptions {
  torrent: Torrent;
  clientTorrent: ClientTorrent | null;
  index?: number;
}

export function formatTorrentFile(file: TorrentFile, options: FormatTorrentFileOptions): Markdown {
  const { torrent, clientTorrent, index } = options;

  const clientTorrentFile = clientTorrent?.files.find(({ path }) => path === file.path);

  const text = Markdown.create`🅰️ ${Markdown.bold('Файл')}: ${
    isDefined(index) && Markdown.create`${formatIndex(index)} `
  }${getFileIcon(file.path)} ${file.path === torrent.name ? file.path : path.relative(torrent.name ?? '', file.path)}
💾 ${Markdown.bold('Размер')}: ${formatSize(file.size)}`;

  if (file.state !== TorrentFileState.Finished) {
    const progress = TorrentClient.getRealProgress(file, torrent, clientTorrentFile);

    text.add`
💯 ${Markdown.bold('Прогресс')}: ${formatProgress(progress)} ${formatPercent(progress)}`;
  }

  return text;
}
