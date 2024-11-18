import { TorrentState } from '@prisma/client';
import { MessageResponse, MessageResponseMode } from '@tg-sensei/bot';
import torrentClient from 'torrent-client/client';

import { TorrentClientCallbackButtonType } from 'telegram-bot/types/keyboard/torrent-client';

import {
  backToCallbackButton,
  callbackButton,
  deleteCallbackButton,
  refreshCallbackButton,
} from 'telegram-bot/utilities/keyboard';
import MessageWithNotificationResponse from 'telegram-bot/utilities/responses/MessageWithNotificationResponse';
import { formatTorrent } from 'telegram-bot/utilities/responses/torrent-client';

import { callbackDataProvider } from 'telegram-bot/bot';
import { getTorrentsListResponse } from 'telegram-bot/responses/torrent-client/torrents/list';

callbackDataProvider.handle(TorrentClientCallbackButtonType.OpenTorrent, async (ctx) => {
  const { torrentId, withDeleteConfirm } = ctx.callbackData;

  await ctx.respondWith(
    await getTorrentResponse(torrentId, {
      withDeleteConfirm,
    }),
  );
});

callbackDataProvider.handle(TorrentClientCallbackButtonType.TorrentDeleteConfirm, async (ctx) => {
  const { torrentId } = ctx.callbackData;

  await torrentClient.deleteTorrent(torrentId);

  await ctx.respondWith(
    new MessageWithNotificationResponse({
      text: 'Торрент успешно удален',
      updateResponse: getTorrentsListResponse(),
    }),
  );
});

callbackDataProvider.handle(TorrentClientCallbackButtonType.TorrentPause, async (ctx) => {
  const { torrentId, pause } = ctx.callbackData;

  if (pause) {
    await torrentClient.pauseTorrent(torrentId);
  } else {
    await torrentClient.unpauseTorrent(torrentId);
  }

  await ctx.respondWith(
    new MessageWithNotificationResponse({
      text: pause ? 'Торрент поставлен на паузу' : 'Торрент снят с паузы',
      updateResponse: await getTorrentResponse(torrentId),
    }),
  );
});

callbackDataProvider.handle(TorrentClientCallbackButtonType.TorrentSetCritical, async (ctx) => {
  const { torrentId, critical } = ctx.callbackData;

  await torrentClient.setCriticalTorrent(torrentId, critical);

  await ctx.respondWith(
    new MessageWithNotificationResponse({
      text: critical ? 'Торрент сделан критичным' : 'Торрент сделан некритичным',
      updateResponse: await getTorrentResponse(torrentId),
    }),
  );
});

export type GetTorrentResponseOptions = {
  withDeleteConfirm?: boolean;
  mode?: MessageResponseMode;
};

export async function getTorrentResponse(
  infoHash: string,
  options: GetTorrentResponseOptions = {},
): Promise<MessageResponse> {
  const { withDeleteConfirm = false, mode } = options;
  const [clientState, torrent] = await Promise.all([torrentClient.getState(), torrentClient.getTorrent(infoHash)]);

  const isPausedOrError = torrent.state === TorrentState.Paused || torrent.state === TorrentState.Error;
  const isCritical = clientState.criticalTorrentId === infoHash;

  return new MessageResponse({
    mode,
    content: await formatTorrent(torrent),
    replyMarkup: await callbackDataProvider.buildInlineKeyboard([
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
    ]),
  });
}
