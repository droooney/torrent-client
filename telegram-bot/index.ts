/* eslint-disable camelcase */

import 'utilities/importEnv';

import * as util from 'node:util';

import torrentClient from '@/torrent-client';
import { Prisma, Torrent } from '@prisma/client';
import { blue, green } from 'colors/safe';
import { User } from 'node-telegram-bot-api';

import commands, { CommandType } from 'telegram-bot/constants/commands';

import prisma from 'db/prisma';

import { tryLoadDocument } from 'telegram-bot/utilities/documents';
import CustomError from 'utilities/CustomError';
import { formatSize, parseSize } from 'utilities/size';

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

  const sendText = async (text: string): Promise<void> => {
    await bot.sendMessage(userId, text);
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

  console.log({
    message,
    userData,
  });

  // before state change
  if (text === CommandType.START || userData.state === 'First') {
    await updateUser({
      state: 'Waiting',
    });

    await sendText('Привет! Я - ТоррентБот. Добавляйте торренты, чтобы поставить их на скачивание');
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
          ? `. Отправьте "-", чтобы снять текущее ограничение (${formatSize(downloadSpeedLimit, 0)}/с)`
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
        uploadSpeedLimit
          ? `. Отправьте "-", чтобы снять текущее ограничение (${formatSize(uploadSpeedLimit, 0)}/с)`
          : ''
      }`,
    );
  } else if (userData.state === 'Waiting') {
    let torrent: Torrent | null = null;

    try {
      torrent = await tryLoadDocument(document);
    } catch (err) {
      console.log(err);

      await sendText(err instanceof CustomError ? err.message : 'Ошибка добавления торрента');
    }

    if (torrent) {
      await sendText('Торрент добавлен!');
    }
  } else if (userData.state === 'AddTorrent') {
    await updateUser({
      state: 'Waiting',
    });

    let torrent: Torrent | null = null;

    try {
      if (document) {
        torrent = await tryLoadDocument(document);
      } else if (text) {
        torrent = await torrentClient.addTorrent({
          type: 'magnet',
          magnet: text,
        });
      }
    } catch (err) {
      console.log(err);

      await sendText(err instanceof CustomError ? err.message : 'Ошибка добавления торрента');
    }

    if (torrent) {
      await sendText('Торрент добавлен!');
    }
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
          : `Выставлено ограниче загрузки ${formatSize(downloadLimit, 0)}/с`,
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
          ? 'Ограничение выгрузки снято'
          : `Выставлено ограниче выгрузки ${formatSize(uploadLimit, 0)}/с`,
      );
    }
  }

  // after state change
  if (newUserData.state !== newUserData.state) {
    // empty
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
