import { Torrent } from '@prisma/client';
import fs from 'fs-extra';
import { Document } from 'node-telegram-bot-api';
import torrentClient from 'torrent-client/client';

import { TextHandlerContext } from 'telegram-bot/utilities/Bot';
import CustomError, { ErrorCode } from 'utilities/CustomError';
import { prepareErrorForLogging } from 'utilities/error';

export function isTorrentDocument(document: Document | undefined): document is Document {
  return document?.mime_type === 'application/x-bittorrent';
}

export async function tryLoadDocument(ctx: TextHandlerContext): Promise<Torrent | null> {
  const { document } = ctx.message;

  if (!isTorrentDocument(document)) {
    return null;
  }

  let filePath: string | null;

  try {
    filePath = await ctx.downloadDocument();
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
