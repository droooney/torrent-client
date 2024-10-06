import { Torrent, TorrentFile, TorrentFileState, TorrentState } from '@prisma/client';
import { Markdown } from '@tg-sensei/bot';
import chunk from 'lodash/chunk';
import sortBy from 'lodash/sortBy';
import rutrackerClient from 'rutracker-client/client';
import torrentClient from 'torrent-client/client';
import { Torrent as ClientTorrent } from 'webtorrent';

import prisma from 'db/prisma';
import { getPaginationInfo } from 'db/utilities/pagination';

import { ActionsStreamAction, MessageAction } from 'telegram-bot/types/actions';
import { RootCallbackButtonType } from 'telegram-bot/types/keyboard/root';
import { TorrentClientCallbackButtonType } from 'telegram-bot/types/keyboard/torrent-client';

import PaginationMessageAction from 'telegram-bot/utilities/actions/PaginationMessageAction';
import {
  addCallbackButton,
  backCallbackButton,
  callbackButton,
  deleteCallbackButton,
  listCallbackButton,
  refreshCallbackButton,
} from 'telegram-bot/utilities/keyboard';
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

export async function getAddTorrentAction(getTorrent: () => Promise<Torrent | null>): Promise<ActionsStreamAction> {
  return new ActionsStreamAction(async function* () {
    const torrentPromise = getTorrent();

    yield new MessageAction({
      content: {
        type: 'text',
        text: 'Торрент добавляется...',
      },
    });

    const torrent = await torrentPromise;

    if (!torrent) {
      yield new MessageAction({
        mode: 'separate',
        content: {
          type: 'text',
          text: 'Данные торрента отсутствуют',
        },
      });

      return;
    }

    yield new MessageAction({
      mode: 'separate',
      content: {
        type: 'text',
        text: Markdown.create`Торрент${torrent.name ? Markdown.create` "${torrent.name}"` : ''} добавлен!`,
      },
      replyMarkup: [
        [
          callbackButton('▶️', 'Подробнее', {
            type: TorrentClientCallbackButtonType.NavigateToTorrent,
            torrentId: torrent.infoHash,
          }),
        ],
      ],
    });
  });
}

export async function getSearchRutrackerAction(query: string): Promise<ActionsStreamAction> {
  return new ActionsStreamAction(async function* () {
    const torrentsPromise = rutrackerClient.search(query);

    yield new MessageAction({
      content: {
        type: 'text',
        text: Markdown.create`Запущен поиск на rutracker по строке "${query}"...`,
      },
    });

    const torrents = await torrentsPromise;

    const topTorrents = torrents.slice(0, 10);

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

    yield new MessageAction({
      content: {
        type: 'text',
        text: text.isEmpty() ? 'Результатов не найдено' : text,
        linkPreviewOptions: {
          is_disabled: true,
        },
      },
      replyMarkup: [
        ...chunk(
          topTorrents.map(({ id }, index) =>
            callbackButton(formatIndex(index), '', {
              type: TorrentClientCallbackButtonType.RutrackerSearchAddTorrent,
              torrentId: id,
            }),
          ),
          2,
        ),
        [
          backCallbackButton({
            type: TorrentClientCallbackButtonType.BackToStatus,
          }),
        ],
      ],
    });
  });
}

// TODO: add keyboard (settings, set limits)
export async function getStatusAction(): Promise<MessageAction> {
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

  status.add`${
    notFinishedTorrentsText.isEmpty() ? Markdown.italic('Нет активных торрентов') : notFinishedTorrentsText
  }`;

  return new MessageAction({
    content: {
      type: 'text',
      text: status,
    },
    replyMarkup: [
      [
        refreshCallbackButton({
          type: TorrentClientCallbackButtonType.StatusRefresh,
        }),
        clientState.paused
          ? callbackButton('▶️', 'Продолжить', {
              type: TorrentClientCallbackButtonType.StatusPause,
              pause: false,
            })
          : callbackButton('⏸', 'Пауза', {
              type: TorrentClientCallbackButtonType.StatusPause,
              pause: true,
            }),
      ],
      [
        addCallbackButton({
          type: TorrentClientCallbackButtonType.AddTorrent,
        }),
        listCallbackButton({
          type: TorrentClientCallbackButtonType.StatusShowTorrentsList,
        }),
      ],
      [
        callbackButton('🔎', 'Поиск по Rutracker', {
          type: TorrentClientCallbackButtonType.RutrackerSearch,
        }),
      ],
      [
        backCallbackButton({
          type: RootCallbackButtonType.BackToRoot,
        }),
      ],
    ],
  });
}

export async function getTorrentsListAction(page: number = 0): Promise<PaginationMessageAction<Torrent>> {
  return new PaginationMessageAction({
    page,
    emptyPageText: Markdown.italic('Нет торрентов'),
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
      type: TorrentClientCallbackButtonType.TorrentsListPage,
      page,
    }),
    getItemButton: (torrent, indexIcon) =>
      callbackButton(indexIcon, torrent.name ?? 'Неизвестно', {
        type: TorrentClientCallbackButtonType.TorrentsListItem,
        torrentId: torrent.infoHash,
      }),
    getItemText: (torrent, indexString) => formatTorrent(torrent, { indexString }),
    getKeyboard: (paginationButtons) => [
      [
        refreshCallbackButton({
          type: TorrentClientCallbackButtonType.TorrentsListRefresh,
          page,
        }),
      ],
      ...paginationButtons,
      [
        backCallbackButton({
          type: TorrentClientCallbackButtonType.BackToStatus,
        }),
      ],
    ],
  });
}

export async function getTorrentAction(infoHash: string, withDeleteConfirm: boolean = false): Promise<MessageAction> {
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

  return new MessageAction({
    content: {
      type: 'text',
      text: await formatTorrent(torrent),
    },
    replyMarkup: [
      torrent.state !== TorrentState.Finished && [
        refreshCallbackButton({
          type: TorrentClientCallbackButtonType.TorrentRefresh,
          torrentId: infoHash,
        }),
        isCritical
          ? callbackButton('❕', 'Сделать некритичным', {
              type: TorrentClientCallbackButtonType.TorrentSetCritical,
              torrentId: infoHash,
              critical: false,
            })
          : callbackButton('❗️', 'Сделать критичным', {
              type: TorrentClientCallbackButtonType.TorrentSetCritical,
              torrentId: infoHash,
              critical: true,
            }),
      ],
      [
        torrent.state !== TorrentState.Finished &&
          (isPausedOrError
            ? callbackButton('▶️', 'Продолжить', {
                type: TorrentClientCallbackButtonType.TorrentPause,
                torrentId: infoHash,
                pause: false,
              })
            : callbackButton('⏸', 'Пауза', {
                type: TorrentClientCallbackButtonType.TorrentPause,
                torrentId: infoHash,
                pause: true,
              })),
        deleteCallbackButton(
          withDeleteConfirm,
          {
            type: TorrentClientCallbackButtonType.TorrentDeleteConfirm,
            torrentId: infoHash,
          },
          {
            type: TorrentClientCallbackButtonType.TorrentDelete,
            torrentId: infoHash,
          },
        ),
      ],
      [
        callbackButton('📄', 'Файлы', {
          type: TorrentClientCallbackButtonType.TorrentShowFiles,
          torrentId: infoHash,
        }),
      ],
      [
        callbackButton('◀️', 'К списку', {
          type: TorrentClientCallbackButtonType.TorrentBackToList,
        }),
      ],
    ],
  });
}

export async function getFilesAction(
  infoHash: string,
  page: number = 0,
): Promise<PaginationMessageAction<TorrentFile>> {
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

  return new PaginationMessageAction({
    page,
    emptyPageText: Markdown.italic('Нет файлов'),
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
      type: TorrentClientCallbackButtonType.FilesListPage,
      torrentId: infoHash,
      page,
    }),
    getItemButton: (file, indexIcon) =>
      callbackButton(indexIcon, TorrentClient.getFileRelativePath(file, torrent), {
        type: TorrentClientCallbackButtonType.NavigateToFile,
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
          type: TorrentClientCallbackButtonType.FilesListRefresh,
          torrentId: infoHash,
          page,
        }),
      ],
      ...paginationButtons,
      [
        callbackButton('◀️', 'К торренту', {
          type: TorrentClientCallbackButtonType.FilesListBackToTorrent,
          torrentId: infoHash,
        }),
      ],
    ],
  });
}

export async function getFileAction(fileId: number, withDeleteConfirm: boolean = false): Promise<MessageAction> {
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

  return new MessageAction({
    content: {
      type: 'text',
      text: formatTorrentFile(file, {
        torrent,
        clientTorrent,
      }),
    },
    replyMarkup: [
      file.state !== TorrentFileState.Finished && [
        refreshCallbackButton({
          type: TorrentClientCallbackButtonType.FileRefresh,
          fileId,
        }),
      ],
      file.state === TorrentFileState.Finished && [
        deleteCallbackButton(
          withDeleteConfirm,
          {
            type: TorrentClientCallbackButtonType.DeleteFileConfirm,
            fileId,
          },
          {
            type: TorrentClientCallbackButtonType.DeleteFile,
            fileId,
          },
        ),
      ],
      [
        callbackButton('◀️', 'К файлам', {
          type: TorrentClientCallbackButtonType.BackToFilesList,
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

export interface FormatTorrentOptions {
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
