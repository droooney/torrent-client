import { TorrentFileState } from '@prisma/client';
import { MessageResponse } from '@tg-sensei/bot';
import torrentClient from 'torrent-client/client';

import { TorrentClientCallbackButtonType } from 'telegram-bot/types/keyboard/torrent-client';

import { backToCallbackButton, deleteCallbackButton, refreshCallbackButton } from 'telegram-bot/utilities/keyboard';
import MessageWithNotificationResponse from 'telegram-bot/utilities/responses/MessageWithNotificationResponse';
import { formatTorrentFile } from 'telegram-bot/utilities/responses/torrent-client';

import { callbackDataProvider } from 'telegram-bot/bot';
import { getFilesResponse } from 'telegram-bot/responses/torrent-client/torrents/torrent/files/list';

callbackDataProvider.handle(TorrentClientCallbackButtonType.OpenFile, async (ctx) => {
  const { fileId, withDeleteConfirm } = ctx.callbackData;

  await ctx.respondWith(
    await getFileResponse(fileId, {
      withDeleteConfirm,
    }),
  );
});

callbackDataProvider.handle(TorrentClientCallbackButtonType.DeleteFileConfirm, async (ctx) => {
  const { fileId } = ctx.callbackData;
  const file = await torrentClient.getFile(fileId);

  await torrentClient.deleteFile(fileId);

  const torrent = await torrentClient.getTorrent(file.torrentId);

  await ctx.respondWith(
    new MessageWithNotificationResponse({
      text: 'Файл успешно удален',
      updateResponse: await getFilesResponse(torrent.infoHash),
    }),
  );
});

type GetFileResponseOptions = {
  withDeleteConfirm?: boolean;
};

async function getFileResponse(fileId: number, options: GetFileResponseOptions = {}): Promise<MessageResponse> {
  const { withDeleteConfirm = false } = options;

  const file = await torrentClient.getFile(fileId);

  const [torrent, clientTorrent] = await Promise.all([
    torrentClient.getTorrent(file.torrentId),
    torrentClient.getClientTorrent(file.torrentId),
  ]);

  return new MessageResponse({
    content: formatTorrentFile(file, {
      torrent,
      clientTorrent,
    }),
    replyMarkup: await callbackDataProvider.buildInlineKeyboard([
      file.state !== TorrentFileState.Finished && [
        refreshCallbackButton({
          type: TorrentClientCallbackButtonType.OpenFile,
          fileId,
          isRefresh: true,
        }),
      ],
      file.state === TorrentFileState.Finished && [
        deleteCallbackButton(
          withDeleteConfirm,
          {
            type: TorrentClientCallbackButtonType.DeleteFileConfirm,
            fileId,
          },
          {
            type: TorrentClientCallbackButtonType.OpenFile,
            fileId,
            withDeleteConfirm: true,
          },
        ),
      ],
      [
        backToCallbackButton('К файлам', {
          type: TorrentClientCallbackButtonType.OpenFiles,
          torrentId: file.torrentId,
        }),
      ],
    ]),
  });
}
