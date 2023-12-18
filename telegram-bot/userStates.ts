import { TelegramUserState } from '@prisma/client';
import torrentClient from 'torrent-client/client';

import Response from 'telegram-bot/utilities/Response';
import { tryLoadDocument } from 'telegram-bot/utilities/documents';
import { getAddTorrentResponse } from 'telegram-bot/utilities/responseUtils';
import { searchRutracker } from 'telegram-bot/utilities/rutracker';
import CustomError from 'utilities/CustomError';
import { formatSpeed, parseSize } from 'utilities/size';

import bot from 'telegram-bot/bot';

bot.handleUserState(TelegramUserState.First, async (ctx) => {
  await ctx.updateUserState({
    state: TelegramUserState.Waiting,
  });

  return new Response({
    text: 'Привет! Я - ТоррентБот. Добавляйте торренты, чтобы поставить их на скачивание',
  });
});

bot.handleUserState(TelegramUserState.Waiting, async (ctx) => {
  const { text } = ctx.message;

  const torrent = await tryLoadDocument(ctx);

  if (torrent) {
    return getAddTorrentResponse(torrent);
  }

  if (text) {
    await searchRutracker(ctx);
  }
});

bot.handleUserState(TelegramUserState.SearchRutracker, async (ctx) => {
  await ctx.updateUserState({
    state: TelegramUserState.Waiting,
  });

  await searchRutracker(ctx);
});

bot.handleUserState(TelegramUserState.AddTorrent, async (ctx) => {
  const { text } = ctx.message;

  await ctx.updateUserState({
    state: TelegramUserState.Waiting,
  });

  let torrent = await tryLoadDocument(ctx);

  if (!torrent && text) {
    torrent = await torrentClient.addTorrent({
      type: 'magnet',
      magnet: text,
    });
  }

  return getAddTorrentResponse(torrent);
});

bot.handleUserState(TelegramUserState.SetDownloadLimit, async (ctx) => {
  const { text } = ctx.message;

  const downloadLimit = text === '-' ? '-' : parseSize(text ?? '');

  if (downloadLimit === null) {
    throw new CustomError('Ошибка формата данных');
  }

  await ctx.updateUserState({
    state: 'Waiting',
  });

  await torrentClient.setDownloadSpeedLimit(downloadLimit === '-' ? null : downloadLimit);

  return new Response({
    text:
      downloadLimit === '-'
        ? 'Ограничение загрузки снято'
        : `Выставлено ограничение загрузки ${formatSpeed(downloadLimit)}`,
  });
});

bot.handleUserState(TelegramUserState.SetUploadLimit, async (ctx) => {
  const { text } = ctx.message;

  const uploadLimit = text === '-' ? '-' : parseSize(text ?? '');

  if (uploadLimit === null) {
    throw new CustomError('Ошибка формата данных');
  }

  await ctx.updateUserState({
    state: 'Waiting',
  });

  await torrentClient.setUploadSpeedLimit(uploadLimit === '-' ? null : uploadLimit);

  return new Response({
    text:
      uploadLimit === '-' ? 'Ограничение отдачи снято' : `Выставлено ограничение отдачи ${formatSpeed(uploadLimit)}`,
  });
});
