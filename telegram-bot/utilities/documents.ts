import path from 'node:path';

import torrentClient from '@/torrent-client';
import { Torrent } from '@prisma/client';
import fs from 'fs-extra';
import { Document } from 'node-telegram-bot-api';

import { DOWNLOADS_DIRECTORY, TORRENTS_DIRECTORY } from 'constants/paths';

import prisma from 'db/prisma';

import CustomError from 'utilities/CustomError';

import bot from 'telegram-bot/bot';

export async function tryLoadDocument(document?: Document): Promise<Torrent | null> {
  if (document?.mime_type !== 'application/x-bittorrent') {
    return null;
  }

  let filePath: string;

  try {
    filePath = await bot.downloadFile(document.file_id, DOWNLOADS_DIRECTORY);
  } catch (err) {
    throw new CustomError('Ошибка загрузки файла', { cause: err });
  }

  return loadTorrentFromFile(filePath);
}

export async function loadTorrentFromFile(filePath: string): Promise<Torrent | null> {
  let torrent: Torrent;

  try {
    torrent = await torrentClient.addTorrent({
      type: 'file',
      path: filePath,
    });
  } catch (err) {
    await fs.remove(filePath);

    throw err;
  }

  const newFilePath = path.resolve(TORRENTS_DIRECTORY, `${torrent.infoHash}.torrent`);
  let copied = false;

  try {
    await fs.copy(filePath, newFilePath);

    copied = true;
  } catch (err) {
    console.log('Copy error', err);
  }

  if (!copied) {
    return torrent;
  }

  let updated = false;

  try {
    await prisma.torrent.update({
      where: {
        infoHash: torrent.infoHash,
      },
      data: {
        torrentPath: newFilePath,
      },
    });

    updated = true;
  } catch {
    try {
      await fs.remove(newFilePath);
    } catch (err) {
      console.log('Remove error', err);
    }
  }

  if (updated) {
    try {
      await fs.remove(filePath);
    } catch (err) {
      console.log('Remove error', err);
    }
  }

  return torrent;
}
