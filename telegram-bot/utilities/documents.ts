import path from 'node:path';

import { Torrent } from '@prisma/client';
import fs from 'fs-extra';
import torrentClient from 'torrent-client/client';

import { DOWNLOADS_DIRECTORY } from 'constants/paths';

import { Document, Message } from 'typescript-telegram-bot-api/dist/types';

import CustomError, { ErrorCode } from 'utilities/CustomError';
import { prepareErrorForLogging } from 'utilities/error';

import bot from 'telegram-bot/bot';

export async function downloadDocument(fileId: string): Promise<string> {
  const filePath = path.resolve(DOWNLOADS_DIRECTORY, fileId);

  await bot.downloadFile({
    fileId,
    path: filePath,
  });

  return filePath;
}

export function isTorrentDocument(document: Document | undefined): document is Document {
  return document?.mime_type === 'application/x-bittorrent';
}

export async function tryLoadTorrentDocument(message: Message): Promise<Torrent | null> {
  const { document } = message;

  if (!isTorrentDocument(document)) {
    return null;
  }

  let filePath: string | null;

  try {
    filePath = await downloadDocument(document.file_id);
  } catch (err) {
    throw new CustomError(ErrorCode.DOWNLOAD_ERROR, 'Ошибка загрузки файла', { cause: err });
  }

  if (!filePath) {
    return null;
  }

  return loadTorrentFromFile(filePath);
}

export async function loadTorrentFromFile(filePath: string): Promise<Torrent> {
  const torrentBuffer = await fs.readFile(filePath);
  let torrent: Torrent;

  try {
    torrent = await torrentClient.addTorrent({
      type: 'file',
      content: torrentBuffer,
    });
  } catch (err) {
    try {
      await fs.remove(filePath);
    } catch (err) {
      console.log(prepareErrorForLogging(err));
    }

    throw err;
  }

  try {
    await fs.remove(filePath);
  } catch (err) {
    console.log(prepareErrorForLogging(err));
  }

  return torrent;
}
