import { Torrent, TorrentFile, TorrentFileState, TorrentState } from '@prisma/client';
import chunk from 'lodash/chunk';
import sortBy from 'lodash/sortBy';
import torrentClient from 'torrent-client/client';
import { Torrent as ClientTorrent } from 'webtorrent';

import prisma from 'db/prisma';
import { getPaginationInfo } from 'db/utilities/pagination';

import { RootCallbackButtonSource } from 'telegram-bot/types/keyboard/root';
import { TorrentClientCallbackButtonSource } from 'telegram-bot/types/keyboard/torrent-client';

import Markdown from 'telegram-bot/utilities/Markdown';
import rutrackerClient from 'telegram-bot/utilities/RutrackerClient';
import {
  backCallbackButton,
  callbackButton,
  confirmDeleteCallbackButton,
  deleteCallbackButton,
  refreshCallbackButton,
} from 'telegram-bot/utilities/keyboard';
import DeferredTextResponse from 'telegram-bot/utilities/response/DeferredTextResponse';
import ImmediateTextResponse from 'telegram-bot/utilities/response/ImmediateTextResponse';
import PaginationTextResponse from 'telegram-bot/utilities/response/PaginationTextResponse';
import TorrentClient from 'torrent-client/utilities/TorrentClient';
import CustomError, { ErrorCode } from 'utilities/CustomError';
import { formatDuration } from 'utilities/date';
import { getFileIcon } from 'utilities/file';
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
            callbackButton('▶️', 'Подробнее', {
              source: TorrentClientCallbackButtonSource.NAVIGATE_TO_TORRENT,
              torrentId: torrent.infoHash,
            }),
          ],
        ],
      });
    },
  });
}

export async function getSearchRutrackerResponse(query: string): Promise<DeferredTextResponse> {
  return new DeferredTextResponse({
    immediate: new ImmediateTextResponse({
      text: Markdown.create`Запущен поиск на rutracker по строке "${query}"...`,
    }),
    async getDeferred() {
      const torrents = await rutrackerClient.search(query);
      const topTorrents = torrents.slice(0, 6);

      const text = Markdown.join(
        topTorrents.map(
          (torrent, index) => Markdown.create`🅰️ ${Markdown.bold('Название')}: ${formatIndex(index)} ${torrent.title}
🧑 ${Markdown.bold('Автор')}: ${torrent.author}
💾 ${Markdown.bold('Размер')}: ${formatSize(torrent.size)}
🔼 ${Markdown.bold('Сидов')}: ${torrent.seeds}
🔗 ${Markdown.bold('Ссылка')}: ${torrent.url}`,
        ),
        '\n\n\n',
      );

      return new ImmediateTextResponse({
        text: text.isEmpty() ? 'Результатов не найдено' : text,
        keyboard: [
          ...chunk(
            topTorrents.map(({ id }, index) =>
              callbackButton(formatIndex(index), '', {
                source: TorrentClientCallbackButtonSource.RUTRACKER_SEARCH_ADD_TORRENT,
                torrentId: id,
              }),
            ),
            2,
          ),
          [
            backCallbackButton({
              source: TorrentClientCallbackButtonSource.BACK_TO_STATUS,
            }),
          ],
        ],
        disableWebPagePreview: true,
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
    status.add`🟠 ${Markdown.italic('Клиент стоит на паузе')}

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
        refreshCallbackButton({
          source: TorrentClientCallbackButtonSource.STATUS_REFRESH,
        }),
        clientState.paused
          ? callbackButton('▶️', 'Продолжить', {
              source: TorrentClientCallbackButtonSource.STATUS_PAUSE,
              pause: false,
            })
          : callbackButton('⏸', 'Пауза', {
              source: TorrentClientCallbackButtonSource.STATUS_PAUSE,
              pause: true,
            }),
      ],
      [
        callbackButton('➕', 'Добавить', {
          source: TorrentClientCallbackButtonSource.ADD_TORRENT,
        }),
        callbackButton('📜', 'Список', {
          source: TorrentClientCallbackButtonSource.STATUS_SHOW_TORRENTS_LIST,
        }),
      ],
      [
        callbackButton('🔎', 'Поиск по Rutracker', {
          source: TorrentClientCallbackButtonSource.RUTRACKER_SEARCH,
        }),
      ],
      [
        backCallbackButton({
          source: RootCallbackButtonSource.BACK_TO_ROOT,
        }),
      ],
    ],
  });
}

export async function getTorrentsListResponse(page: number = 0): Promise<PaginationTextResponse<Torrent>> {
  return new PaginationTextResponse({
    page,
    emptyPageText: 'Нет торрентов',
    getPageItemsInfo: async (options) => {
      const { items, allCount } = await getPaginationInfo({
        table: 'torrent',
        findOptions: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        pagination: options,
      });

      return {
        items: sortTorrents(items),
        allCount,
      };
    },
    getPageButtonCallbackData: (page) => ({
      source: TorrentClientCallbackButtonSource.TORRENTS_LIST_PAGE,
      page,
    }),
    getItemButton: (torrent, indexIcon) =>
      callbackButton(indexIcon, torrent.name ?? 'Неизвестно', {
        source: TorrentClientCallbackButtonSource.TORRENTS_LIST_ITEM,
        torrentId: torrent.infoHash,
      }),
    getItemText: (torrent, indexString) => formatTorrent(torrent, { indexString }),
    getKeyboard: (paginationButtons) => [
      [
        refreshCallbackButton({
          source: TorrentClientCallbackButtonSource.TORRENTS_LIST_REFRESH,
          page,
        }),
      ],
      ...paginationButtons,
      [
        backCallbackButton({
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
        refreshCallbackButton({
          source: TorrentClientCallbackButtonSource.TORRENT_REFRESH,
          torrentId: infoHash,
        }),
        isCritical
          ? callbackButton('❕', 'Сделать некритичным', {
              source: TorrentClientCallbackButtonSource.TORRENT_SET_CRITICAL,
              torrentId: infoHash,
              critical: false,
            })
          : callbackButton('❗️', 'Сделать критичным', {
              source: TorrentClientCallbackButtonSource.TORRENT_SET_CRITICAL,
              torrentId: infoHash,
              critical: true,
            }),
      ],
      [
        torrent.state !== TorrentState.Finished &&
          (isPausedOrError
            ? callbackButton('▶️', 'Продолжить', {
                source: TorrentClientCallbackButtonSource.TORRENT_PAUSE,
                torrentId: infoHash,
                pause: false,
              })
            : callbackButton('⏸', 'Пауза', {
                source: TorrentClientCallbackButtonSource.TORRENT_PAUSE,
                torrentId: infoHash,
                pause: true,
              })),
        withDeleteConfirm
          ? confirmDeleteCallbackButton({
              source: TorrentClientCallbackButtonSource.TORRENT_DELETE_CONFIRM,
              torrentId: infoHash,
            })
          : deleteCallbackButton({
              source: TorrentClientCallbackButtonSource.TORRENT_DELETE,
              torrentId: infoHash,
            }),
      ],
      [
        callbackButton('📄', 'Файлы', {
          source: TorrentClientCallbackButtonSource.TORRENT_SHOW_FILES,
          torrentId: infoHash,
        }),
      ],
      [
        callbackButton('◀️', 'К списку', {
          source: TorrentClientCallbackButtonSource.TORRENT_BACK_TO_LIST,
        }),
      ],
    ],
  });
}

export async function getFilesResponse(
  infoHash: string,
  page: number = 0,
): Promise<PaginationTextResponse<TorrentFile>> {
  const [torrent, clientTorrent] = await Promise.all([
    prisma.torrent.findUnique({
      where: {
        infoHash,
      },
    }),
    torrentClient.getClientTorrent(infoHash),
  ]);

  if (!torrent) {
    throw new CustomError(ErrorCode.NOT_FOUND, 'Торрент не найден');
  }

  return new PaginationTextResponse({
    page,
    emptyPageText: 'Нет файлов',
    getPageItemsInfo: async (options) =>
      getPaginationInfo({
        table: 'torrentFile',
        findOptions: {
          where: {
            torrentId: infoHash,
          },
          orderBy: {
            path: 'asc',
          },
        },
        pagination: options,
      }),
    getPageButtonCallbackData: (page) => ({
      source: TorrentClientCallbackButtonSource.FILES_LIST_PAGE,
      torrentId: infoHash,
      page,
    }),
    getItemButton: (file, indexIcon) =>
      callbackButton(indexIcon, TorrentClient.getFileRelativePath(file, torrent), {
        source: TorrentClientCallbackButtonSource.NAVIGATE_TO_FILE,
        fileId: file.id,
      }),
    getItemText: (file, indexString) =>
      formatTorrentFile(file, {
        torrent,
        clientTorrent,
        indexString,
      }),
    getKeyboard: (paginationButtons) => [
      torrent.state !== TorrentState.Finished && [
        refreshCallbackButton({
          source: TorrentClientCallbackButtonSource.FILES_LIST_REFRESH,
          torrentId: infoHash,
          page,
        }),
      ],
      ...paginationButtons,
      [
        callbackButton('◀️', 'К торренту', {
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
        refreshCallbackButton({
          source: TorrentClientCallbackButtonSource.FILE_REFRESH,
          fileId,
        }),
      ],
      file.state === TorrentFileState.Finished && [
        withDeleteConfirm
          ? confirmDeleteCallbackButton({
              source: TorrentClientCallbackButtonSource.DELETE_FILE_CONFIRM,
              fileId,
            })
          : deleteCallbackButton({
              source: TorrentClientCallbackButtonSource.DELETE_FILE,
              fileId,
            }),
      ],
      [
        callbackButton('◀️', 'К файлам', {
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
  const formattedTorrents = await Promise.all(sortedTorrents.map((torrent) => formatTorrent(torrent)));

  return Markdown.join(formattedTorrents, '\n\n\n');
}

interface FormatTorrentOptions {
  indexString?: string;
}

export async function formatTorrent(torrent: Torrent, options: FormatTorrentOptions = {}): Promise<Markdown> {
  const { indexString } = options;

  const [clientTorrent, clientState] = await Promise.all([
    torrentClient.getClientTorrent(torrent.infoHash),
    torrentClient.getState(),
  ]);
  const progress = TorrentClient.getRealProgress(torrent, torrent, clientTorrent);

  const text = Markdown.create`🅰️ ${Markdown.bold('Название')}: ${indexString && Markdown.create`${indexString} `}${
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
⚡️ ${Markdown.bold('Скорость загрузки')}: ${formatSpeed(clientTorrent.downloadSpeed)}`;
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

export interface FormatTorrentFileOptions {
  torrent: Torrent;
  clientTorrent: ClientTorrent | null;
  indexString?: string;
}

export function formatTorrentFile(file: TorrentFile, options: FormatTorrentFileOptions): Markdown {
  const { torrent, clientTorrent, indexString } = options;

  const clientTorrentFile = clientTorrent?.files.find(({ path }) => path === file.path);

  const text = Markdown.create`🅰️ ${Markdown.bold('Файл')}: ${
    indexString && Markdown.create`${indexString} `
  }${getFileIcon(file.path)} ${TorrentClient.getFileRelativePath(file, torrent)}
💾 ${Markdown.bold('Размер')}: ${formatSize(file.size)}`;

  if (file.state !== TorrentFileState.Finished) {
    const progress = TorrentClient.getRealProgress(file, torrent, clientTorrentFile);

    text.add`
💯 ${Markdown.bold('Прогресс')}: ${formatProgress(progress)} ${formatPercent(progress)}`;
  }

  return text;
}
