import { TorrentFileState } from '@prisma/client';
import torrentClient from 'torrent-client/client';

import { MessageAction } from 'telegram-bot/types/actions';
import { TorrentClientCallbackButtonType } from 'telegram-bot/types/keyboard/torrent-client';

import MessageWithNotificationAction from 'telegram-bot/utilities/actions/MessageWithNotificationAction';
import RefreshDataAction from 'telegram-bot/utilities/actions/RefreshDataAction';
import { formatTorrentFile } from 'telegram-bot/utilities/actions/torrent-client';
import { backToCallbackButton, deleteCallbackButton, refreshCallbackButton } from 'telegram-bot/utilities/keyboard';

import { getFilesAction } from 'telegram-bot/actions/torrent-client/torrents/torrent/files/list';
import { callbackDataProvider } from 'telegram-bot/bot';

callbackDataProvider.handle(TorrentClientCallbackButtonType.OpenFile, async ({ data }) => {
  return getFileAction(data.fileId, {
    withDeleteConfirm: data.withDeleteConfirm,
  });
});

callbackDataProvider.handle(TorrentClientCallbackButtonType.FileRefresh, async ({ data }) => {
  return new RefreshDataAction(await getFileAction(data.fileId));
});

callbackDataProvider.handle(TorrentClientCallbackButtonType.DeleteFileConfirm, async ({ data }) => {
  const file = await torrentClient.getFile(data.fileId);

  await torrentClient.deleteFile(data.fileId);

  const torrent = await torrentClient.getTorrent(file.torrentId);

  return new MessageWithNotificationAction({
    text: 'Файл успешно удален',
    updateAction: await getFilesAction(torrent.infoHash),
  });
});

type GetFileActionOptions = {
  withDeleteConfirm?: boolean;
};

async function getFileAction(fileId: number, options: GetFileActionOptions = {}): Promise<MessageAction> {
  const { withDeleteConfirm = false } = options;

  const file = await torrentClient.getFile(fileId);

  const [torrent, clientTorrent] = await Promise.all([
    torrentClient.getTorrent(file.torrentId),
    torrentClient.getClientTorrent(file.torrentId),
  ]);

  return new MessageAction({
    content: {
      type: 'text',
      text: formatTorrentFile(file, {
        torrent,
        clientTorrent,
      }),
    },
    replyMarkup: [
      file.state !== TorrentFileState.Finished && [
        refreshCallbackButton({
          type: TorrentClientCallbackButtonType.FileRefresh,
          fileId,
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
    ],
  });
}
