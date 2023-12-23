import torrentClient from 'torrent-client/client';

import { CallbackButtonSource } from 'telegram-bot/types/keyboard';

import Response from 'telegram-bot/utilities/Response';
import rutrackerClient from 'telegram-bot/utilities/RutrackerClient';
import {
  getAddTorrentResponse,
  getStatusResponse,
  getTelegramTorrentInfo,
  getTelegramTorrentsListResponse,
} from 'telegram-bot/utilities/response/torrent-client';

import bot from 'telegram-bot/bot';

bot.handleCallbackQuery(
  [
    CallbackButtonSource.TORRENTS_LIST_ITEM,
    CallbackButtonSource.TORRENT_REFRESH,
    CallbackButtonSource.NAVIGATE_TO_TORRENT,
    CallbackButtonSource.TORRENT_DELETE,
  ],
  async (ctx) => {
    return getTelegramTorrentInfo(ctx.data.torrentId, ctx.data.source === CallbackButtonSource.TORRENT_DELETE);
  },
);

bot.handleCallbackQuery(
  [
    CallbackButtonSource.TORRENTS_LIST_PAGE,
    CallbackButtonSource.TORRENTS_LIST_REFRESH,
    CallbackButtonSource.TORRENT_BACK_TO_LIST,
  ],
  async (ctx) => {
    return getTelegramTorrentsListResponse('page' in ctx.data ? ctx.data.page : 0);
  },
);

bot.handleCallbackQuery(CallbackButtonSource.TORRENT_DELETE_CONFIRM, async (ctx) => {
  await torrentClient.deleteTorrent(ctx.data.torrentId);

  return new Response({
    text: 'Торрент успеешно удален',
    keyboard: [
      [
        {
          type: 'callback',
          text: '◀️ К списку',
          callbackData: {
            source: CallbackButtonSource.TORRENT_BACK_TO_LIST,
          },
        },
      ],
    ],
  });
});

bot.handleCallbackQuery(CallbackButtonSource.TORRENT_PAUSE, async (ctx) => {
  const { torrentId, pause } = ctx.data;

  if (pause) {
    await torrentClient.pauseTorrent(torrentId);
  } else {
    await torrentClient.unpauseTorrent(torrentId);
  }

  return getTelegramTorrentInfo(torrentId);
});

bot.handleCallbackQuery(CallbackButtonSource.TORRENT_SET_CRITICAL, async (ctx) => {
  const { torrentId, critical } = ctx.data;

  await torrentClient.setCriticalTorrent(torrentId, critical);

  return getTelegramTorrentInfo(torrentId);
});

bot.handleCallbackQuery(CallbackButtonSource.STATUS_REFRESH, async () => {
  return getStatusResponse();
});

bot.handleCallbackQuery(CallbackButtonSource.STATUS_PAUSE, async (ctx) => {
  if (ctx.data.pause) {
    await torrentClient.pause();
  } else {
    await torrentClient.unpause();
  }

  return getStatusResponse();
});

bot.handleCallbackQuery(CallbackButtonSource.RUTRACKER_SEARCH_ADD_TORRENT, async (ctx) => {
  return getAddTorrentResponse(() => rutrackerClient.addTorrent(ctx.data.torrentId));
});
