import { TelegramUserState } from '@prisma/client';
import torrentClient from 'torrent-client/client';

import prisma from 'db/prisma';

import { TorrentClientCallbackButtonSource } from 'telegram-bot/types/keyboard/torrent-client';

import rutrackerClient from 'telegram-bot/utilities/RutrackerClient';
import { backCallbackButton } from 'telegram-bot/utilities/keyboard';
import ImmediateTextResponse from 'telegram-bot/utilities/response/ImmediateTextResponse';
import NotificationResponse from 'telegram-bot/utilities/response/NotificationResponse';
import RefreshNotificationResponse from 'telegram-bot/utilities/response/RefreshNotificationResponse';
import {
  getAddTorrentResponse,
  getFileResponse,
  getFilesResponse,
  getStatusResponse,
  getTorrentResponse,
  getTorrentsListResponse,
} from 'telegram-bot/utilities/response/torrent-client';
import CustomError, { ErrorCode } from 'utilities/CustomError';

import bot from 'telegram-bot/bot';

bot.handleCallbackQuery(
  [
    TorrentClientCallbackButtonSource.TORRENTS_LIST_ITEM,
    TorrentClientCallbackButtonSource.NAVIGATE_TO_TORRENT,
    TorrentClientCallbackButtonSource.TORRENT_DELETE,
    TorrentClientCallbackButtonSource.FILES_LIST_BACK_TO_TORRENT,
  ],
  async (ctx) => {
    return getTorrentResponse(ctx.data.torrentId, ctx.data.source === TorrentClientCallbackButtonSource.TORRENT_DELETE);
  },
);

bot.handleCallbackQuery(TorrentClientCallbackButtonSource.TORRENT_REFRESH, async (ctx) => {
  return new RefreshNotificationResponse(await getTorrentResponse(ctx.data.torrentId));
});

bot.handleCallbackQuery(
  [
    TorrentClientCallbackButtonSource.STATUS_SHOW_TORRENTS_LIST,
    TorrentClientCallbackButtonSource.TORRENTS_LIST_PAGE,
    TorrentClientCallbackButtonSource.TORRENT_BACK_TO_LIST,
  ],
  async (ctx) => {
    return getTorrentsListResponse('page' in ctx.data ? ctx.data.page : 0);
  },
);

bot.handleCallbackQuery(TorrentClientCallbackButtonSource.TORRENTS_LIST_REFRESH, async (ctx) => {
  return new RefreshNotificationResponse(
    await (await getTorrentsListResponse(ctx.data.page)).generateImmediateResponse(),
  );
});

bot.handleCallbackQuery(TorrentClientCallbackButtonSource.TORRENT_DELETE_CONFIRM, async (ctx) => {
  await torrentClient.deleteTorrent(ctx.data.torrentId);

  return new NotificationResponse({
    text: 'Торрент успешно удален',
    updateMessage: await (await getTorrentsListResponse()).generateImmediateResponse(),
  });
});

bot.handleCallbackQuery(TorrentClientCallbackButtonSource.TORRENT_PAUSE, async (ctx) => {
  const { torrentId, pause } = ctx.data;

  if (pause) {
    await torrentClient.pauseTorrent(torrentId);
  } else {
    await torrentClient.unpauseTorrent(torrentId);
  }

  return new NotificationResponse({
    text: pause ? 'Торрент поставлен на паузу' : 'Торрент снят с паузы',
    updateMessage: await getTorrentResponse(torrentId),
  });
});

bot.handleCallbackQuery(TorrentClientCallbackButtonSource.TORRENT_SET_CRITICAL, async (ctx) => {
  const { torrentId, critical } = ctx.data;

  await torrentClient.setCriticalTorrent(torrentId, critical);

  return new NotificationResponse({
    text: critical ? 'Торрент сделан критичным' : 'Торрент сделан некритичным',
    updateMessage: await getTorrentResponse(torrentId),
  });
});

bot.handleCallbackQuery(TorrentClientCallbackButtonSource.BACK_TO_STATUS, async () => {
  return getStatusResponse();
});

bot.handleCallbackQuery(TorrentClientCallbackButtonSource.STATUS_REFRESH, async () => {
  return new RefreshNotificationResponse(await getStatusResponse());
});

bot.handleCallbackQuery(TorrentClientCallbackButtonSource.STATUS_PAUSE, async (ctx) => {
  const { pause } = ctx.data;

  if (pause) {
    await torrentClient.pause();
  } else {
    await torrentClient.unpause();
  }

  return new NotificationResponse({
    text: pause ? 'Клиент поставлен на паузу' : 'Клиент снят с паузы',
    updateMessage: await getStatusResponse(),
  });
});

bot.handleCallbackQuery(TorrentClientCallbackButtonSource.RUTRACKER_SEARCH_ADD_TORRENT, async (ctx) => {
  return getAddTorrentResponse(() => rutrackerClient.addTorrent(ctx.data.torrentId));
});

bot.handleCallbackQuery(TorrentClientCallbackButtonSource.ADD_TORRENT, async (ctx) => {
  await ctx.updateUserState({
    state: TelegramUserState.AddTorrent,
  });

  return new ImmediateTextResponse({
    text: 'Отправьте торрент или magnet-ссылку',
    keyboard: [
      [
        backCallbackButton({
          source: TorrentClientCallbackButtonSource.BACK_TO_STATUS,
        }),
      ],
    ],
  });
});

bot.handleCallbackQuery(
  [
    TorrentClientCallbackButtonSource.TORRENT_SHOW_FILES,
    TorrentClientCallbackButtonSource.FILES_LIST_PAGE,
    TorrentClientCallbackButtonSource.BACK_TO_FILES_LIST,
  ],
  async (ctx) => {
    return getFilesResponse(ctx.data.torrentId, 'page' in ctx.data ? ctx.data.page : 0);
  },
);

bot.handleCallbackQuery(TorrentClientCallbackButtonSource.FILES_LIST_REFRESH, async (ctx) => {
  return new RefreshNotificationResponse(
    await (await getFilesResponse(ctx.data.torrentId, ctx.data.page)).generateImmediateResponse(),
  );
});

bot.handleCallbackQuery(
  [TorrentClientCallbackButtonSource.NAVIGATE_TO_FILE, TorrentClientCallbackButtonSource.DELETE_FILE],
  async (ctx) => {
    return getFileResponse(ctx.data.fileId, ctx.data.source === TorrentClientCallbackButtonSource.DELETE_FILE);
  },
);

bot.handleCallbackQuery(TorrentClientCallbackButtonSource.FILE_REFRESH, async (ctx) => {
  return new RefreshNotificationResponse(await getFileResponse(ctx.data.fileId));
});

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

  const torrent = await prisma.torrent.findUnique({
    where: {
      infoHash: file.torrentId,
    },
  });

  if (!torrent) {
    throw new CustomError(ErrorCode.NOT_FOUND, 'Торрент не найден');
  }

  return new NotificationResponse({
    text: 'Файл успешно удален',
    updateMessage: await (await getFilesResponse(torrent.infoHash)).generateImmediateResponse(),
  });
});

bot.handleCallbackQuery(TorrentClientCallbackButtonSource.RUTRACKER_SEARCH, async (ctx) => {
  await ctx.updateUserState({
    state: TelegramUserState.SearchRutracker,
  });

  return new ImmediateTextResponse({
    text: 'Введите название для поиска на rutracker',
    keyboard: [
      [
        backCallbackButton({
          source: TorrentClientCallbackButtonSource.BACK_TO_STATUS,
        }),
      ],
    ],
  });
});
