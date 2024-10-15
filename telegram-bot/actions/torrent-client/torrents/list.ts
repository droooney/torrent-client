import { Torrent } from '@prisma/client';
import { Markdown } from '@tg-sensei/bot';

import { getPaginationInfo } from 'db/utilities/pagination';

import { TorrentClientCallbackButtonType } from 'telegram-bot/types/keyboard/torrent-client';

import PaginationMessageAction from 'telegram-bot/utilities/actions/PaginationMessageAction';
import RefreshDataAction from 'telegram-bot/utilities/actions/RefreshDataAction';
import { formatTorrent, sortTorrents } from 'telegram-bot/utilities/actions/torrent-client';
import { backCallbackButton, callbackButton, refreshCallbackButton } from 'telegram-bot/utilities/keyboard';

import { callbackDataProvider } from 'telegram-bot/bot';

callbackDataProvider.handle(TorrentClientCallbackButtonType.OpenTorrentsList, async ({ data }) => {
  const action = getTorrentsListAction(data.page);

  return data.isRefresh ? new RefreshDataAction(action) : action;
});

export function getTorrentsListAction(page: number = 0): PaginationMessageAction<Torrent> {
  return new PaginationMessageAction({
    page,
    emptyPageText: Markdown.italic('Нет торрентов'),
    getPageItemsInfo: async (options) => {
      const { items, allCount } = await getPaginationInfo({
        table: 'torrent',
        findOptions: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        pagination: options,
      });

      return {
        items: sortTorrents(items),
        allCount,
      };
    },
    getPageButtonCallbackData: (page) => ({
      type: TorrentClientCallbackButtonType.OpenTorrentsList,
      page,
    }),
    getItemButton: (torrent, indexIcon) =>
      callbackButton(indexIcon, torrent.name ?? 'Неизвестно', {
        type: TorrentClientCallbackButtonType.OpenTorrent,
        torrentId: torrent.infoHash,
      }),
    getItemText: (torrent, indexString) => formatTorrent(torrent, { indexString }),
    getKeyboard: (paginationButtons) => [
      [
        refreshCallbackButton({
          type: TorrentClientCallbackButtonType.OpenTorrentsList,
          page,
          isRefresh: true,
        }),
      ],
      ...paginationButtons,
      [
        backCallbackButton({
          type: TorrentClientCallbackButtonType.OpenStatus,
        }),
      ],
    ],
  });
}
