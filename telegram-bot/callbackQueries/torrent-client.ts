import { TelegramUserState } from '@prisma/client';
import torrentClient from 'torrent-client/client';

import prisma from 'db/prisma';

import { TorrentClientCallbackButtonSource } from 'telegram-bot/types/keyboard/torrent-client';

import rutrackerClient from 'telegram-bot/utilities/RutrackerClient';
import TextResponse from 'telegram-bot/utilities/TextResponse';
import { callbackButton } from 'telegram-bot/utilities/keyboard';
import {
  getAddTorrentResponse,
  getFileResponse,
  getFilesResponse,
  getStatusResponse,
  getTelegramTorrentInfo,
  getTelegramTorrentsListResponse,
} from 'telegram-bot/utilities/response/torrent-client';
import CustomError, { ErrorCode } from 'utilities/CustomError';

import bot from 'telegram-bot/bot';

bot.handleCallbackQuery(
  [
    TorrentClientCallbackButtonSource.TORRENTS_LIST_ITEM,
    TorrentClientCallbackButtonSource.TORRENT_REFRESH,
    TorrentClientCallbackButtonSource.NAVIGATE_TO_TORRENT,
    TorrentClientCallbackButtonSource.TORRENT_DELETE,
    TorrentClientCallbackButtonSource.FILES_LIST_BACK_TO_TORRENT,
  ],
  async (ctx) => {
    return getTelegramTorrentInfo(
      ctx.data.torrentId,
      ctx.data.source === TorrentClientCallbackButtonSource.TORRENT_DELETE,
    );
  },
);

bot.handleCallbackQuery(
  [
    TorrentClientCallbackButtonSource.STATUS_SHOW_TORRENTS_LIST,
    TorrentClientCallbackButtonSource.TORRENTS_LIST_PAGE,
    TorrentClientCallbackButtonSource.TORRENTS_LIST_REFRESH,
    TorrentClientCallbackButtonSource.TORRENT_BACK_TO_LIST,
  ],
  async (ctx) => {
    return getTelegramTorrentsListResponse('page' in ctx.data ? ctx.data.page : 0);
  },
);

bot.handleCallbackQuery(TorrentClientCallbackButtonSource.TORRENT_DELETE_CONFIRM, async (ctx) => {
  await torrentClient.deleteTorrent(ctx.data.torrentId);

  return new TextResponse({
    text: 'Торрент успешно удален',
    keyboard: [
      [
        callbackButton('◀️ К списку', {
          source: TorrentClientCallbackButtonSource.TORRENT_BACK_TO_LIST,
        }),
      ],
    ],
  });
});

bot.handleCallbackQuery(TorrentClientCallbackButtonSource.TORRENT_PAUSE, async (ctx) => {
  const { torrentId, pause } = ctx.data;

  if (pause) {
    await torrentClient.pauseTorrent(torrentId);
  } else {
    await torrentClient.unpauseTorrent(torrentId);
  }

  return getTelegramTorrentInfo(torrentId);
});

bot.handleCallbackQuery(TorrentClientCallbackButtonSource.TORRENT_SET_CRITICAL, async (ctx) => {
  const { torrentId, critical } = ctx.data;

  await torrentClient.setCriticalTorrent(torrentId, critical);

  return getTelegramTorrentInfo(torrentId);
});

bot.handleCallbackQuery(
  [TorrentClientCallbackButtonSource.BACK_TO_STATUS, TorrentClientCallbackButtonSource.STATUS_REFRESH],
  async () => {
    return getStatusResponse();
  },
);

bot.handleCallbackQuery(TorrentClientCallbackButtonSource.STATUS_PAUSE, async (ctx) => {
  if (ctx.data.pause) {
    await torrentClient.pause();
  } else {
    await torrentClient.unpause();
  }

  return getStatusResponse();
});

bot.handleCallbackQuery(TorrentClientCallbackButtonSource.RUTRACKER_SEARCH_ADD_TORRENT, async (ctx) => {
  return getAddTorrentResponse(() => rutrackerClient.addTorrent(ctx.data.torrentId));
});

bot.handleCallbackQuery(TorrentClientCallbackButtonSource.ADD_TORRENT, async (ctx) => {
  await ctx.updateUserState({
    state: TelegramUserState.AddTorrent,
  });

  return new TextResponse({
    text: 'Отправьте торрент или magnet-ссылку',
  });
});

bot.handleCallbackQuery(
  [
    TorrentClientCallbackButtonSource.TORRENT_SHOW_FILES,
    TorrentClientCallbackButtonSource.FILES_LIST_PAGE,
    TorrentClientCallbackButtonSource.FILES_LIST_REFRESH,
    TorrentClientCallbackButtonSource.BACK_TO_FILES_LIST,
  ],
  async (ctx) => {
    return getFilesResponse(ctx.data.torrentId, 'page' in ctx.data ? ctx.data.page : 0);
  },
);

bot.handleCallbackQuery(
  [
    TorrentClientCallbackButtonSource.NAVIGATE_TO_FILE,
    TorrentClientCallbackButtonSource.FILE_REFRESH,
    TorrentClientCallbackButtonSource.DELETE_FILE,
  ],
  async (ctx) => {
    return getFileResponse(ctx.data.fileId, ctx.data.source === TorrentClientCallbackButtonSource.DELETE_FILE);
  },
);

bot.handleCallbackQuery(TorrentClientCallbackButtonSource.DELETE_FILE_CONFIRM, async (ctx) => {
  const file = await prisma.torrentFile.findUnique({
    where: {
      id: ctx.data.fileId,
    },
  });

  if (!file) {
    throw new CustomError(ErrorCode.NOT_FOUND, 'Файл не найден');
  }

  await torrentClient.deleteFile(ctx.data.fileId);

  return new TextResponse({
    text: 'Файл успешно удален',
    keyboard: [
      [
        callbackButton('◀️ К файлам', {
          source: TorrentClientCallbackButtonSource.BACK_TO_FILES_LIST,
          torrentId: file.torrentId,
        }),
      ],
    ],
  });
});
