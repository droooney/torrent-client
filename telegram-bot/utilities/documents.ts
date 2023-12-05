import path from 'node:path';

import torrentClient from '@/torrent-client';
import { Torrent } from '@prisma/client';
import fs from 'fs-extra';
import { Document } from 'node-telegram-bot-api';

import prisma from 'db/prisma';

import CustomError from 'utilities/CustomError';

import bot from 'telegram-bot/bot';

export async function tryLoadDocument(document?: Document): Promise<Torrent | null> {
  if (document?.mime_type !== 'application/x-bittorrent') {
    return null;
  }

  let defaultFilePath: string;

  try {
    defaultFilePath = await bot.downloadFile(document.file_id, path.resolve('./torrent-client/downloads'));
  } catch (err) {
    throw new CustomError('Ошибка загрузки файла', { cause: err });
  }

  let torrent: Torrent;

  try {
    torrent = await torrentClient.addTorrent({
      type: 'file',
      path: defaultFilePath,
    });
  } catch (err) {
    await fs.remove(defaultFilePath);

    throw err;
  }

  if (!document.file_name) {
    return torrent;
  }

  const newFilePath = path.resolve('./torrent-client/torrents', `${torrent.infoHash}-${document.file_name}`);
  let copied = false;

  try {
    await fs.copy(defaultFilePath, newFilePath);

    copied = true;
  } catch (err) {
    console.log('Copy error', err);
  }

  if (!copied) {
    return torrent;
  }

  try {
    await prisma.torrent.update({
      where: {
        infoHash: torrent.infoHash,
      },
      data: {
        torrentPath: newFilePath,
      },
    });

    await fs.remove(defaultFilePath);
  } catch {
    await fs.remove(newFilePath);
  }

  return torrent;
}
