import { TorrentFile, TorrentState } from '@prisma/client';
import { Markdown } from '@tg-sensei/bot';
import torrentClient from 'torrent-client/client';

import { getPaginationInfo } from 'db/utilities/pagination';

import { TorrentClientCallbackButtonType } from 'telegram-bot/types/keyboard/torrent-client';

import PaginationMessageAction from 'telegram-bot/utilities/actions/PaginationMessageAction';
import RefreshDataAction from 'telegram-bot/utilities/actions/RefreshDataAction';
import { formatTorrentFile } from 'telegram-bot/utilities/actions/torrent-client';
import { backToCallbackButton, callbackButton, refreshCallbackButton } from 'telegram-bot/utilities/keyboard';
import TorrentClient from 'torrent-client/utilities/TorrentClient';

import { callbackDataProvider } from 'telegram-bot/bot';

callbackDataProvider.handle(TorrentClientCallbackButtonType.OpenFiles, async ({ data }) => {
  return getFilesAction(data.torrentId, data.page);
});

callbackDataProvider.handle(TorrentClientCallbackButtonType.FilesListRefresh, async ({ data }) => {
  return new RefreshDataAction(await getFilesAction(data.torrentId, data.page));
});

export async function getFilesAction(
  infoHash: string,
  page: number = 0,
): Promise<PaginationMessageAction<TorrentFile>> {
  const [torrent, clientTorrent] = await Promise.all([
    torrentClient.getTorrent(infoHash),
    torrentClient.getClientTorrent(infoHash),
  ]);

  return new PaginationMessageAction({
    page,
    emptyPageText: Markdown.italic('Нет файлов'),
    getPageItemsInfo: async (options) =>
      getPaginationInfo({
        table: 'torrentFile',
        findOptions: {
          where: {
            torrentId: infoHash,
          },
          orderBy: {
            path: 'asc',
          },
        },
        pagination: options,
      }),
    getPageButtonCallbackData: (page) => ({
      type: TorrentClientCallbackButtonType.OpenFiles,
      torrentId: infoHash,
      page,
    }),
    getItemButton: (file, indexIcon) =>
      callbackButton(indexIcon, TorrentClient.getFileRelativePath(file, torrent), {
        type: TorrentClientCallbackButtonType.OpenFile,
        fileId: file.id,
      }),
    getItemText: (file, indexString) =>
      formatTorrentFile(file, {
        torrent,
        clientTorrent,
        indexString,
      }),
    getKeyboard: (paginationButtons) => [
      torrent.state !== TorrentState.Finished && [
        refreshCallbackButton({
          type: TorrentClientCallbackButtonType.FilesListRefresh,
          torrentId: infoHash,
          page,
        }),
      ],
      ...paginationButtons,
      [
        backToCallbackButton('К торренту', {
          type: TorrentClientCallbackButtonType.OpenTorrent,
          torrentId: infoHash,
        }),
      ],
    ],
  });
}
