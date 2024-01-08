import path from 'node:path';

import { Torrent, TorrentFile, TorrentFileState, TorrentState } from '@prisma/client';
import chunk from 'lodash/chunk';
import sortBy from 'lodash/sortBy';
import torrentClient from 'torrent-client/client';
import { Torrent as ClientTorrent } from 'webtorrent';

import prisma from 'db/prisma';

import { RootCallbackButtonSource } from 'telegram-bot/types/keyboard/root';
import { TorrentClientCallbackButtonSource } from 'telegram-bot/types/keyboard/torrent-client';

import Markdown from 'telegram-bot/utilities/Markdown';
import rutrackerClient from 'telegram-bot/utilities/RutrackerClient';
import { callbackButton } from 'telegram-bot/utilities/keyboard';
import DeferredTextResponse from 'telegram-bot/utilities/response/DeferredTextResponse';
import ImmediateTextResponse from 'telegram-bot/utilities/response/ImmediateTextResponse';
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

export async function getAddTorrentResponse(getTorrent: () => Promise<Torrent | null>): Promise<DeferredTextResponse> {
  return new DeferredTextResponse({
    immediate: new ImmediateTextResponse({
      text: 'Торрент добавляется...',
    }),
    async getDeferred() {
      const torrent = await getTorrent();

      if (!torrent) {
        return new ImmediateTextResponse({
          text: 'Данные торрента отсутствуют',
        });
      }

      return new ImmediateTextResponse({
        text: Markdown.create`Торрент${torrent.name ? Markdown.create` "${torrent.name}"` : ''} добавлен!`,
        keyboard: [
          [
            callbackButton('▶️ Подробнее', {
              source: TorrentClientCallbackButtonSource.NAVIGATE_TO_TORRENT,
              torrentId: torrent.infoHash,
            }),
          ],
        ],
      });
    },
  });
}

export async function getSearchRutrackerResponse(text: string): Promise<DeferredTextResponse> {
  return new DeferredTextResponse({
    immediate: new ImmediateTextResponse({
      text: Markdown.create`Запущен поиск на rutracker по строке "${text}"...`,
    }),
    async getDeferred() {
      const torrents = await rutrackerClient.search(text);
      const topTorrents = torrents.slice(0, 10);

      if (!torrents.length) {
        return new ImmediateTextResponse({
          text: 'Результатов не найдено',
        });
      }

      return new ImmediateTextResponse({
        text: Markdown.join(
          topTorrents.map(
            ({ title, author, seeds, size }, index) => Markdown.create`🅰️ ${Markdown.bold('Название')}: ${formatIndex(
              index,
            )} ${title}
🧑 ${Markdown.bold('Автор')}: ${author}
💾 ${Markdown.bold('Размер')}: ${formatSize(size)}
🔼 ${Markdown.bold('Сидов')}: ${seeds}`,
          ),
          '\n\n\n',
        ),
        keyboard: chunk(
          topTorrents.map(({ id }, index) =>
            callbackButton(formatIndex(index), {
              source: TorrentClientCallbackButtonSource.RUTRACKER_SEARCH_ADD_TORRENT,
              torrentId: id,
            }),
          ),
          3,
        ),
      });
    },
  });
}

// TODO: add keyboard (settings, set limits)
export async function getStatusResponse(): Promise<ImmediateTextResponse> {
  const [clientState, downloadSpeed, uploadSpeed, notFinishedTorrents, { _sum: allTorrentsSum }] = await Promise.all([
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
    prisma.torrent.aggregate({
      _sum: {
        size: true,
      },
    }),
  ]);

  const allTorrentsSize = allTorrentsSum.size ?? 0n;

  const status = new Markdown();

  if (clientState.paused) {
    status.add`🟠 Клиент стоит на паузе

`;
  }

  status.add`${Markdown.bold('⚡️ Скорость загрузки')}: ${formatSpeed(downloadSpeed)}${
    clientState.downloadSpeedLimit !== null &&
    Markdown.create` (ограничение: ${formatSpeed(clientState.downloadSpeedLimit)})`
  }
${Markdown.bold('⚡️ Скорость отдачи')}: ${formatSpeed(uploadSpeed)}${
    clientState.uploadSpeedLimit !== null &&
    Markdown.create` (ограничение: ${formatSpeed(clientState.uploadSpeedLimit)})`
  }
${Markdown.bold('💾 Размер всех торрентов')}: ${formatSize(allTorrentsSize)}

`;

  const notFinishedTorrentsText = await formatTorrents(notFinishedTorrents);

  status.add`${notFinishedTorrentsText.isEmpty() ? 'Нет активных торрентов' : notFinishedTorrentsText}`;

  return new ImmediateTextResponse({
    text: status,
    keyboard: [
      [
        callbackButton('🔄 Обновить', {
          source: TorrentClientCallbackButtonSource.STATUS_REFRESH,
        }),
        callbackButton(clientState.paused ? '▶️ Продолжить' : '⏸ Пауза', {
          source: TorrentClientCallbackButtonSource.STATUS_PAUSE,
          pause: !clientState.paused,
        }),
      ],
      [
        callbackButton('➕ Добавить', {
          source: TorrentClientCallbackButtonSource.ADD_TORRENT,
        }),
        callbackButton('📜 Список', {
          source: TorrentClientCallbackButtonSource.STATUS_SHOW_TORRENTS_LIST,
        }),
      ],
      [
        callbackButton('◀️ Назад', {
          source: RootCallbackButtonSource.BACK_TO_ROOT,
        }),
      ],
    ],
  });
}

export async function getTorrentsListResponse(page: number = 0): Promise<ImmediateTextResponse> {
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

  return new ImmediateTextResponse({
    text: text.isEmpty() ? 'Нет торрентов' : text,
    keyboard: [
      [
        callbackButton('🔄 Обновить', {
          source: TorrentClientCallbackButtonSource.TORRENTS_LIST_REFRESH,
          page,
        }),
      ],
      ...pageTorrents.map((torrent) => [
        callbackButton(`📄 ${torrent.name ?? 'Неизвестно'}`, {
          source: TorrentClientCallbackButtonSource.TORRENTS_LIST_ITEM,
          torrentId: torrent.infoHash,
        }),
      ]),
      [
        hasPrevButton &&
          callbackButton('◀️', {
            source: TorrentClientCallbackButtonSource.TORRENTS_LIST_PAGE,
            page: page - 1,
          }),
        hastNextButton &&
          callbackButton('▶️', {
            source: TorrentClientCallbackButtonSource.TORRENTS_LIST_PAGE,
            page: page + 1,
          }),
      ],
      [
        callbackButton('◀️ Назад', {
          source: TorrentClientCallbackButtonSource.BACK_TO_STATUS,
        }),
      ],
    ],
  });
}

export async function getTorrentResponse(
  infoHash: string,
  withDeleteConfirm: boolean = false,
): Promise<ImmediateTextResponse> {
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

  return new ImmediateTextResponse({
    text: await formatTorrent(torrent),
    keyboard: [
      torrent.state !== TorrentState.Finished && [
        callbackButton('🔄 Обновить', {
          source: TorrentClientCallbackButtonSource.TORRENT_REFRESH,
          torrentId: infoHash,
        }),
        callbackButton(isCritical ? '❕ Сделать некритичным' : '❗️ Сделать критичным', {
          source: TorrentClientCallbackButtonSource.TORRENT_SET_CRITICAL,
          torrentId: infoHash,
          critical: !isCritical,
        }),
      ],
      [
        torrent.state !== TorrentState.Finished &&
          callbackButton(isPausedOrError ? '▶️ Продолжить' : '⏸ Пауза', {
            source: TorrentClientCallbackButtonSource.TORRENT_PAUSE,
            torrentId: infoHash,
            pause: !isPausedOrError,
          }),
        withDeleteConfirm
          ? callbackButton('🗑 Точно удалить?', {
              source: TorrentClientCallbackButtonSource.TORRENT_DELETE_CONFIRM,
              torrentId: infoHash,
            })
          : callbackButton('🗑 Удалить', {
              source: TorrentClientCallbackButtonSource.TORRENT_DELETE,
              torrentId: infoHash,
            }),
      ],
      [
        callbackButton('📄 Файлы', {
          source: TorrentClientCallbackButtonSource.TORRENT_SHOW_FILES,
          torrentId: infoHash,
        }),
      ],
      [
        callbackButton('◀️ К списку', {
          source: TorrentClientCallbackButtonSource.TORRENT_BACK_TO_LIST,
        }),
      ],
    ],
  });
}

export async function getFilesResponse(infoHash: string, page: number = 0): Promise<ImmediateTextResponse> {
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

  const text = formatTorrentFiles(pageFiles, {
    torrent,
    clientTorrent,
  });

  return new ImmediateTextResponse({
    text: text.isEmpty() ? 'Нет файлов' : text,
    keyboard: [
      torrent.state !== TorrentState.Finished && [
        callbackButton('🔄 Обновить', {
          source: TorrentClientCallbackButtonSource.FILES_LIST_REFRESH,
          torrentId: infoHash,
          page,
        }),
      ],
      ...chunk(
        pageFiles.map(({ id }, index) =>
          callbackButton(formatIndex(index), {
            source: TorrentClientCallbackButtonSource.NAVIGATE_TO_FILE,
            fileId: id,
          }),
        ),
        3,
      ),
      [
        hasPrevButton &&
          callbackButton('◀️', {
            source: TorrentClientCallbackButtonSource.FILES_LIST_PAGE,
            torrentId: infoHash,
            page: page - 1,
          }),
        hastNextButton &&
          callbackButton('▶️', {
            source: TorrentClientCallbackButtonSource.FILES_LIST_PAGE,
            torrentId: infoHash,
            page: page + 1,
          }),
      ],
      [
        callbackButton('◀️ К торренту', {
          source: TorrentClientCallbackButtonSource.FILES_LIST_BACK_TO_TORRENT,
          torrentId: infoHash,
        }),
      ],
    ],
  });
}

export async function getFileResponse(
  fileId: number,
  withDeleteConfirm: boolean = false,
): Promise<ImmediateTextResponse> {
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

  return new ImmediateTextResponse({
    text: formatTorrentFile(file, {
      torrent,
      clientTorrent,
    }),
    keyboard: [
      file.state !== TorrentFileState.Finished && [
        callbackButton('🔄 Обновить', {
          source: TorrentClientCallbackButtonSource.FILE_REFRESH,
          fileId,
        }),
      ],
      file.state === TorrentFileState.Finished && [
        withDeleteConfirm
          ? callbackButton('🗑 Точно удалить?', {
              source: TorrentClientCallbackButtonSource.DELETE_FILE_CONFIRM,
              fileId,
            })
          : callbackButton('🗑 Удалить', {
              source: TorrentClientCallbackButtonSource.DELETE_FILE,
              fileId,
            }),
      ],
      [
        callbackButton('◀️ К файлам', {
          source: TorrentClientCallbackButtonSource.BACK_TO_FILES_LIST,
          torrentId: file.torrentId,
        }),
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

  return Markdown.join(formattedTorrents, '\n\n\n');
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
    '\n\n\n',
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
