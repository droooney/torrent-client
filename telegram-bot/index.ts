/* eslint-disable camelcase */

import 'utilities/importEnv';

import * as util from 'node:util';

import torrentClient from '@/torrent-client';
import { Prisma, Torrent } from '@prisma/client';
import { blue, green } from 'colors/safe';
import chunk from 'lodash/chunk';
import isEqual from 'lodash/isEqual';
import { EditMessageTextOptions, InlineKeyboardMarkup, SendMessageOptions, User } from 'node-telegram-bot-api';

import commands, { CommandType } from 'telegram-bot/constants/commands';

import prisma from 'db/prisma';

import { CallbackButtonSource, callbackDataSchema } from 'telegram-bot/types/keyboard';

import rutrackerClient from 'telegram-bot/utilities/RutrackerClient';
import { tryLoadDocument } from 'telegram-bot/utilities/documents';
import { beautifyCallbackData, prepareInlineKeyboard } from 'telegram-bot/utilities/serialize';
import {
  getTelegramStatus,
  getTelegramTorrentInfo,
  getTelegramTorrentsListInfo,
} from 'torrent-client/utilities/telegram';
import CustomError from 'utilities/CustomError';
import { formatIndex } from 'utilities/number';
import { formatSize, formatSpeed, parseSize } from 'utilities/size';

import bot from 'telegram-bot/bot';

util.inspect.defaultOptions.depth = null;

const USERNAME_WHITELIST: (string | undefined)[] = process.env.USERNAME_WHITELIST?.split(',').filter(Boolean) ?? [];

const isUserAllowed = (user: User): boolean => {
  return USERNAME_WHITELIST.includes(user.username);
};

bot.on('message', async (message) => {
  const { from: user, text, document } = message;

  if (!user || !isUserAllowed(user)) {
    return;
  }

  const userId = user.id;

  const userData = await prisma.telegramUserData.upsert({
    where: {
      userId,
    },
    update: {},
    create: {
      userId,
      state: 'First',
    },
  });
  let newUserData = userData;

  const sendText = async (text: string, options?: SendMessageOptions): Promise<void> => {
    await bot.sendMessage(userId, text, options);
  };

  const updateUser = async (
    data: Prisma.XOR<Prisma.TelegramUserDataUpdateInput, Prisma.TelegramUserDataUncheckedUpdateInput>,
  ): Promise<void> => {
    newUserData = await prisma.telegramUserData.update({
      where: {
        userId,
      },
      data,
    });
  };

  const searchRutracker = async (text: string) => {
    const torrents = await rutrackerClient.search(text);
    const topTorrents = torrents.slice(0, 10);

    if (torrents.length) {
      await sendText(
        topTorrents
          .map(
            ({ title, seeds, size }, index) => `${formatIndex(index)} ${title} (${formatSize(size)}, ${seeds} сидов)`,
          )
          .join('\n\n'),
        {
          reply_markup: prepareInlineKeyboard(
            chunk(
              topTorrents.map(({ id }, index) => ({
                type: 'callback',
                text: formatIndex(index),
                callbackData: {
                  source: CallbackButtonSource.RUTRACKER_SEARCH_ADD_TORRENT,
                  torrentId: id,
                },
              })),
              3,
            ),
          ),
        },
      );
    } else {
      await sendText('Результатов не найдено');
    }
  };

  const afterAddTorrent = async (torrent: Torrent | null) => {
    if (!torrent) {
      return;
    }

    await sendText(`Торрент${torrent.name ? ` "${torrent.name}"` : ''} добавлен!`, {
      reply_markup: prepareInlineKeyboard([
        [
          {
            type: 'callback',
            text: '▶️ Подробнее',
            callbackData: {
              source: CallbackButtonSource.NAVIGATE_TO_TORRENT,
              torrentId: torrent.infoHash,
            },
          },
        ],
      ]),
    });
  };

  console.log({
    message,
    userData,
  });

  try {
    // before state change
    if (text === CommandType.START || userData.state === 'First') {
      await updateUser({
        state: 'Waiting',
      });

      await sendText('Привет! Я - ТоррентБот. Добавляйте торренты, чтобы поставить их на скачивание');
    } else if (text === CommandType.STATUS) {
      await updateUser({
        state: 'Waiting',
      });

      const { status, keyboard } = await getTelegramStatus();

      await sendText(status, { reply_markup: keyboard });
    } else if (text === CommandType.LIST) {
      await updateUser({
        state: 'Waiting',
      });

      const { info, keyboard } = await getTelegramTorrentsListInfo();

      await sendText(info, {
        reply_markup: keyboard,
      });
    } else if (text === CommandType.PAUSE) {
      await updateUser({
        state: 'Waiting',
      });

      await torrentClient.pause();

      await sendText('Клиент поставлен на паузу');
    } else if (text === CommandType.UNPAUSE) {
      await updateUser({
        state: 'Waiting',
      });

      await torrentClient.unpause();

      await sendText('Клиент снят с паузы');
    } else if (text === CommandType.SEARCH_RUTRACKER) {
      await updateUser({
        state: 'SearchRutracker',
      });

      await sendText('Введите строку поиска на rutracker');
    } else if (text === CommandType.ADD_TORRENT) {
      await updateUser({
        state: 'AddTorrent',
      });

      await sendText('Отправьте торрент или magnet-ссылку');
    } else if (text === CommandType.SET_DOWNLOAD_LIMIT) {
      await updateUser({
        state: 'SetDownloadLimit',
      });

      const { downloadSpeedLimit } = await torrentClient.getState();

      await sendText(
        `Отправьте строку вида "10мб", чтобы ограничить скорость загрузки${
          downloadSpeedLimit
            ? `. Отправьте "-", чтобы снять текущее ограничение (${formatSpeed(downloadSpeedLimit)})`
            : ''
        }`,
      );
    } else if (text === CommandType.SET_UPLOAD_LIMIT) {
      await updateUser({
        state: 'SetUploadLimit',
      });

      const { uploadSpeedLimit } = await torrentClient.getState();

      await sendText(
        `Отправьте строку вида "10мб", чтобы ограничить скорость выгрузки${
          uploadSpeedLimit ? `. Отправьте "-", чтобы снять текущее ограничение (${formatSpeed(uploadSpeedLimit)})` : ''
        }`,
      );
    } else if (userData.state === 'Waiting') {
      if (document) {
        const torrent = await tryLoadDocument(document);

        await afterAddTorrent(torrent);
      } else if (text) {
        await searchRutracker(text);
      }
    } else if (userData.state === 'SearchRutracker') {
      await updateUser({
        state: 'Waiting',
      });

      await searchRutracker(text ?? '');
    } else if (userData.state === 'AddTorrent') {
      await updateUser({
        state: 'Waiting',
      });

      let torrent: Torrent | null = null;

      if (document) {
        torrent = await tryLoadDocument(document);
      } else if (text) {
        torrent = await torrentClient.addTorrent({
          type: 'magnet',
          magnet: text,
        });
      }

      await afterAddTorrent(torrent);
    } else if (userData.state === 'SetDownloadLimit') {
      const downloadLimit = text === '-' ? '-' : parseSize(text ?? '');

      if (downloadLimit === null) {
        await sendText('Ошибка формата данных');
      } else {
        await updateUser({
          state: 'Waiting',
        });

        await torrentClient.setDownloadSpeedLimit(downloadLimit === '-' ? null : downloadLimit);

        await sendText(
          downloadLimit === '-'
            ? 'Ограничение загрузки снято'
            : `Выставлено ограничение загрузки ${formatSpeed(downloadLimit)}`,
        );
      }
    } else if (userData.state === 'SetUploadLimit') {
      const uploadLimit = text === '-' ? '-' : parseSize(text ?? '');

      if (uploadLimit === null) {
        await sendText('Ошибка формата данных');
      } else {
        await updateUser({
          state: 'Waiting',
        });

        await torrentClient.setUploadSpeedLimit(uploadLimit === '-' ? null : uploadLimit);

        await sendText(
          uploadLimit === '-'
            ? 'Ограничение отдачи снято'
            : `Выставлено ограничение отдачи ${formatSpeed(uploadLimit)}`,
        );
      }
    }

    // after state change
    if (newUserData.state !== newUserData.state) {
      // empty
    }
  } catch (err) {
    await sendText(err instanceof CustomError ? err.message : 'Произошла ошибка');
  }
});

bot.on('callback_query', async (query) => {
  const { from: user, message, data } = query;

  if (!user || !isUserAllowed(user)) {
    return;
  }

  const userId = user.id;

  const userData = await prisma.telegramUserData.findUnique({
    where: {
      userId,
    },
  });

  if (!userData) {
    return;
  }

  const editMessageText = async (
    text: string,
    options?: Omit<EditMessageTextOptions, 'chat_id' | 'message_id'>,
  ): Promise<void> => {
    await bot.editMessageText(text, {
      ...options,
      chat_id: message?.chat.id,
      message_id: message?.message_id,
    });
  };

  console.log({
    query,
    userData,
  });

  if (!data) {
    return;
  }

  const callbackData = JSON.parse(data);

  try {
    const uglifiedCallbackData = callbackDataSchema.parse(callbackData);
    const beautifiedCallbackData = beautifyCallbackData(uglifiedCallbackData);

    let newText: string = message?.text ?? '';
    let newKeyboard: InlineKeyboardMarkup | undefined;

    if (
      beautifiedCallbackData.source === CallbackButtonSource.TORRENTS_LIST_ITEM ||
      beautifiedCallbackData.source === CallbackButtonSource.TORRENT_REFRESH ||
      beautifiedCallbackData.source === CallbackButtonSource.NAVIGATE_TO_TORRENT ||
      beautifiedCallbackData.source === CallbackButtonSource.TORRENT_DELETE
    ) {
      ({ info: newText, keyboard: newKeyboard } = await getTelegramTorrentInfo(
        beautifiedCallbackData.torrentId,
        beautifiedCallbackData.source === CallbackButtonSource.TORRENT_DELETE,
      ));
    } else if (
      beautifiedCallbackData.source === CallbackButtonSource.TORRENTS_LIST_PAGE ||
      beautifiedCallbackData.source === CallbackButtonSource.TORRENTS_LIST_REFRESH ||
      beautifiedCallbackData.source === CallbackButtonSource.TORRENT_BACK_TO_LIST
    ) {
      ({ info: newText, keyboard: newKeyboard } = await getTelegramTorrentsListInfo(
        'page' in beautifiedCallbackData ? beautifiedCallbackData.page : 0,
      ));
    } else if (beautifiedCallbackData.source === CallbackButtonSource.TORRENT_DELETE_CONFIRM) {
      await torrentClient.deleteTorrent(beautifiedCallbackData.torrentId);

      newText = 'Торрент успеешно удален';
      newKeyboard = prepareInlineKeyboard([
        [
          {
            type: 'callback',
            text: '◀️ К списку',
            callbackData: {
              source: CallbackButtonSource.TORRENT_BACK_TO_LIST,
            },
          },
        ],
      ]);
    } else if (beautifiedCallbackData.source === CallbackButtonSource.TORRENT_PAUSE) {
      if (beautifiedCallbackData.pause) {
        await torrentClient.pauseTorrent(beautifiedCallbackData.torrentId);
      } else {
        await torrentClient.unpauseTorrent(beautifiedCallbackData.torrentId);
      }

      ({ info: newText, keyboard: newKeyboard } = await getTelegramTorrentInfo(beautifiedCallbackData.torrentId));
    } else if (beautifiedCallbackData.source === CallbackButtonSource.TORRENT_SET_CRITICAL) {
      await torrentClient.setCriticalTorrent(beautifiedCallbackData.torrentId, beautifiedCallbackData.critical);

      ({ info: newText, keyboard: newKeyboard } = await getTelegramTorrentInfo(beautifiedCallbackData.torrentId));
    } else if (beautifiedCallbackData.source === CallbackButtonSource.STATUS_REFRESH) {
      ({ status: newText, keyboard: newKeyboard } = await getTelegramStatus());
    } else if (beautifiedCallbackData.source === CallbackButtonSource.STATUS_PAUSE) {
      if (beautifiedCallbackData.pause) {
        await torrentClient.pause();
      } else {
        await torrentClient.unpause();
      }

      ({ status: newText, keyboard: newKeyboard } = await getTelegramStatus());
    } else if (beautifiedCallbackData.source === CallbackButtonSource.RUTRACKER_SEARCH_ADD_TORRENT) {
      const torrent = await rutrackerClient.addTorrent(beautifiedCallbackData.torrentId);

      if (torrent) {
        ({ info: newText, keyboard: newKeyboard } = await getTelegramTorrentInfo(torrent.infoHash));
      }
    }

    if (newText !== message?.text || !isEqual(message.reply_markup, newKeyboard)) {
      await editMessageText(newText, {
        reply_markup: newKeyboard,
      });
    }
  } catch (err) {
    console.log(err);
  }
});

console.log(blue('Bot started'));

(async () => {
  await bot.setMyCommands(commands);

  await bot.startPolling();

  console.log(green('Bot listening...'));
})().catch((err) => {
  console.log(err);

  process.exit(1);
});
