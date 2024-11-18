import { TorrentFile, TorrentState } from '@prisma/client';
import { Markdown } from '@tg-sensei/bot';
import torrentClient from 'torrent-client/client';

import { getPaginationInfo } from 'db/utilities/pagination';

import { TorrentClientCallbackButtonType } from 'telegram-bot/types/keyboard/torrent-client';

import { backToCallbackButton, callbackButton, refreshCallbackButton } from 'telegram-bot/utilities/keyboard';
import PaginationMessageResponse from 'telegram-bot/utilities/responses/PaginationMessageResponse';
import { formatTorrentFile } from 'telegram-bot/utilities/responses/torrent-client';
import TorrentClient from 'torrent-client/utilities/TorrentClient';

import { callbackDataProvider } from 'telegram-bot/bot';

callbackDataProvider.handle(TorrentClientCallbackButtonType.OpenFiles, async (ctx) => {
  const { torrentId, page } = ctx.callbackData;

  await ctx.respondWith(await getFilesResponse(torrentId, page));
});

export async function getFilesResponse(
  infoHash: string,
  page: number = 0,
): Promise<PaginationMessageResponse<TorrentFile>> {
  const [torrent, clientTorrent] = await Promise.all([
    torrentClient.getTorrent(infoHash),
    torrentClient.getClientTorrent(infoHash),
  ]);

  return new PaginationMessageResponse({
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
          type: TorrentClientCallbackButtonType.OpenFiles,
          torrentId: infoHash,
          page,
          isRefresh: true,
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
