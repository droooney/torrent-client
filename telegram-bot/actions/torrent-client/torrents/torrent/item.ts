import { TorrentState } from '@prisma/client';
import { MessageActionMode } from '@tg-sensei/bot';
import torrentClient from 'torrent-client/client';

import { MessageAction } from 'telegram-bot/types/actions';
import { TorrentClientCallbackButtonType } from 'telegram-bot/types/keyboard/torrent-client';

import MessageWithNotificationAction from 'telegram-bot/utilities/actions/MessageWithNotificationAction';
import RefreshDataAction from 'telegram-bot/utilities/actions/RefreshDataAction';
import { formatTorrent } from 'telegram-bot/utilities/actions/torrent-client';
import {
  backToCallbackButton,
  callbackButton,
  deleteCallbackButton,
  refreshCallbackButton,
} from 'telegram-bot/utilities/keyboard';

import { getTorrentsListAction } from 'telegram-bot/actions/torrent-client/torrents/list';
import { callbackDataProvider } from 'telegram-bot/bot';

callbackDataProvider.handle(TorrentClientCallbackButtonType.OpenTorrent, async ({ data }) => {
  const action = await getTorrentAction(data.torrentId, {
    withDeleteConfirm: data.withDeleteConfirm,
  });

  return data.isRefresh ? new RefreshDataAction(action) : action;
});

callbackDataProvider.handle(TorrentClientCallbackButtonType.TorrentDeleteConfirm, async ({ data }) => {
  await torrentClient.deleteTorrent(data.torrentId);

  return new MessageWithNotificationAction({
    text: 'Торрент успешно удален',
    updateAction: getTorrentsListAction(),
  });
});

callbackDataProvider.handle(TorrentClientCallbackButtonType.TorrentPause, async ({ data }) => {
  const { torrentId, pause } = data;

  if (pause) {
    await torrentClient.pauseTorrent(torrentId);
  } else {
    await torrentClient.unpauseTorrent(torrentId);
  }

  return new MessageWithNotificationAction({
    text: pause ? 'Торрент поставлен на паузу' : 'Торрент снят с паузы',
    updateAction: await getTorrentAction(torrentId),
  });
});

callbackDataProvider.handle(TorrentClientCallbackButtonType.TorrentSetCritical, async ({ data }) => {
  const { torrentId, critical } = data;

  await torrentClient.setCriticalTorrent(torrentId, critical);

  return new MessageWithNotificationAction({
    text: critical ? 'Торрент сделан критичным' : 'Торрент сделан некритичным',
    updateAction: await getTorrentAction(torrentId),
  });
});

export type GetTorrentActionOptions = {
  withDeleteConfirm?: boolean;
  mode?: MessageActionMode;
};

export async function getTorrentAction(
  infoHash: string,
  options: GetTorrentActionOptions = {},
): Promise<MessageAction> {
  const { withDeleteConfirm = false, mode } = options;
  const [clientState, torrent] = await Promise.all([torrentClient.getState(), torrentClient.getTorrent(infoHash)]);

  const isPausedOrError = torrent.state === TorrentState.Paused || torrent.state === TorrentState.Error;
  const isCritical = clientState.criticalTorrentId === infoHash;

  return new MessageAction({
    mode,
    content: {
      type: 'text',
      text: await formatTorrent(torrent),
    },
    replyMarkup: [
      torrent.state !== TorrentState.Finished && [
        refreshCallbackButton({
          type: TorrentClientCallbackButtonType.OpenTorrent,
          torrentId: infoHash,
          isRefresh: true,
        }),
        isCritical
          ? callbackButton('❕', 'Сделать некритичным', {
              type: TorrentClientCallbackButtonType.TorrentSetCritical,
              torrentId: infoHash,
              critical: false,
            })
          : callbackButton('❗️', 'Сделать критичным', {
              type: TorrentClientCallbackButtonType.TorrentSetCritical,
              torrentId: infoHash,
              critical: true,
            }),
      ],
      [
        torrent.state !== TorrentState.Finished &&
          (isPausedOrError
            ? callbackButton('▶️', 'Продолжить', {
                type: TorrentClientCallbackButtonType.TorrentPause,
                torrentId: infoHash,
                pause: false,
              })
            : callbackButton('⏸', 'Пауза', {
                type: TorrentClientCallbackButtonType.TorrentPause,
                torrentId: infoHash,
                pause: true,
              })),
        deleteCallbackButton(
          withDeleteConfirm,
          {
            type: TorrentClientCallbackButtonType.TorrentDeleteConfirm,
            torrentId: infoHash,
          },
          {
            type: TorrentClientCallbackButtonType.OpenTorrent,
            torrentId: infoHash,
            withDeleteConfirm: true,
          },
        ),
      ],
      [
        callbackButton('📄', 'Файлы', {
          type: TorrentClientCallbackButtonType.OpenFiles,
          torrentId: infoHash,
        }),
      ],
      [
        backToCallbackButton('К списку', {
          type: TorrentClientCallbackButtonType.OpenTorrentsList,
        }),
      ],
    ],
  });
}
