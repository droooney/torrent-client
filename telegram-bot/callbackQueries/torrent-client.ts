import { TelegramUserState } from '@prisma/client';
import torrentClient from 'torrent-client/client';

import { CallbackButtonSource } from 'telegram-bot/types/keyboard';

import Response from 'telegram-bot/utilities/Response';
import rutrackerClient from 'telegram-bot/utilities/RutrackerClient';
import {
  getAddTorrentResponse,
  getFilesResponse,
  getStatusResponse,
  getTelegramTorrentInfo,
  getTelegramTorrentsListResponse,
} from 'telegram-bot/utilities/response/torrent-client';

import bot from 'telegram-bot/bot';

bot.handleCallbackQuery(
  [
    CallbackButtonSource.TORRENT_CLIENT_TORRENTS_LIST_ITEM,
    CallbackButtonSource.TORRENT_CLIENT_TORRENT_REFRESH,
    CallbackButtonSource.TORRENT_CLIENT_NAVIGATE_TO_TORRENT,
    CallbackButtonSource.TORRENT_CLIENT_TORRENT_DELETE,
    CallbackButtonSource.TORRENT_CLIENT_BACK_TO_TORRENT,
  ],
  async (ctx) => {
    return getTelegramTorrentInfo(
      ctx.data.torrentId,
      ctx.data.source === CallbackButtonSource.TORRENT_CLIENT_TORRENT_DELETE,
    );
  },
);

bot.handleCallbackQuery(
  [
    CallbackButtonSource.TORRENT_CLIENT_STATUS_SHOW_TORRENTS_LIST,
    CallbackButtonSource.TORRENT_CLIENT_TORRENTS_LIST_PAGE,
    CallbackButtonSource.TORRENT_CLIENT_TORRENTS_LIST_REFRESH,
    CallbackButtonSource.TORRENT_CLIENT_TORRENT_BACK_TO_LIST,
  ],
  async (ctx) => {
    return getTelegramTorrentsListResponse('page' in ctx.data ? ctx.data.page : 0);
  },
);

bot.handleCallbackQuery(CallbackButtonSource.TORRENT_CLIENT_TORRENT_DELETE_CONFIRM, async (ctx) => {
  await torrentClient.deleteTorrent(ctx.data.torrentId);

  return new Response({
    text: 'Торрент успешно удален',
    keyboard: [
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
});

bot.handleCallbackQuery(CallbackButtonSource.TORRENT_CLIENT_TORRENT_PAUSE, async (ctx) => {
  const { torrentId, pause } = ctx.data;

  if (pause) {
    await torrentClient.pauseTorrent(torrentId);
  } else {
    await torrentClient.unpauseTorrent(torrentId);
  }

  return getTelegramTorrentInfo(torrentId);
});

bot.handleCallbackQuery(CallbackButtonSource.TORRENT_CLIENT_TORRENT_SET_CRITICAL, async (ctx) => {
  const { torrentId, critical } = ctx.data;

  await torrentClient.setCriticalTorrent(torrentId, critical);

  return getTelegramTorrentInfo(torrentId);
});

bot.handleCallbackQuery(
  [CallbackButtonSource.TORRENT_CLIENT_BACK_TO_STATUS, CallbackButtonSource.TORRENT_CLIENT_STATUS_REFRESH],
  async () => {
    return getStatusResponse();
  },
);

bot.handleCallbackQuery(CallbackButtonSource.TORRENT_CLIENT_STATUS_PAUSE, async (ctx) => {
  if (ctx.data.pause) {
    await torrentClient.pause();
  } else {
    await torrentClient.unpause();
  }

  return getStatusResponse();
});

bot.handleCallbackQuery(CallbackButtonSource.TORRENT_CLIENT_RUTRACKER_SEARCH_ADD_TORRENT, async (ctx) => {
  return getAddTorrentResponse(() => rutrackerClient.addTorrent(ctx.data.torrentId));
});

bot.handleCallbackQuery(CallbackButtonSource.TORRENT_CLIENT_ADD_TORRENT, async (ctx) => {
  await ctx.updateUserState({
    state: TelegramUserState.AddTorrent,
  });

  return new Response({
    text: 'Отправьте торрент или magnet-ссылку',
  });
});

bot.handleCallbackQuery(
  [
    CallbackButtonSource.TORRENT_CLIENT_TORRENT_SHOW_FILES,
    CallbackButtonSource.TORRENT_CLIENT_TORRENT_FILES_PAGE,
    CallbackButtonSource.TORRENT_CLIENT_TORRENT_FILES_REFRESH,
  ],
  async (ctx) => {
    return getFilesResponse(ctx.data.torrentId, 'page' in ctx.data ? ctx.data.page : 0);
  },
);
