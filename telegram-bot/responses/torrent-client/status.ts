import { TorrentState } from '@prisma/client';
import { Markdown, MessageResponse } from '@tg-sensei/bot';
import torrentClient from 'torrent-client/client';

import prisma from 'db/prisma';

import { RootCallbackButtonType } from 'telegram-bot/types/keyboard/root';
import { TorrentClientCallbackButtonType } from 'telegram-bot/types/keyboard/torrent-client';

import {
  addCallbackButton,
  backCallbackButton,
  callbackButton,
  listCallbackButton,
  refreshCallbackButton,
} from 'telegram-bot/utilities/keyboard';
import MessageWithNotificationResponse from 'telegram-bot/utilities/responses/MessageWithNotificationResponse';
import { formatTorrents } from 'telegram-bot/utilities/responses/torrent-client';
import { formatSize, formatSpeed } from 'utilities/size';

import { callbackDataProvider } from 'telegram-bot/bot';

callbackDataProvider.handle(TorrentClientCallbackButtonType.OpenStatus, async (ctx) => {
  await ctx.respondWith(await getStatusResponse());
});

callbackDataProvider.handle(TorrentClientCallbackButtonType.PauseClient, async (ctx) => {
  const { pause } = ctx.callbackData;

  if (pause) {
    await torrentClient.pause();
  } else {
    await torrentClient.unpause();
  }

  await ctx.respondWith(
    new MessageWithNotificationResponse({
      text: pause ? 'Клиент поставлен на паузу' : 'Клиент снят с паузы',
      updateResponse: await getStatusResponse(),
    }),
  );
});

// TODO: add keyboard (settings, set limits)
async function getStatusResponse(): Promise<MessageResponse> {
  const [clientState, downloadSpeed, notFinishedTorrents, { _sum: allTorrentsSum }] = await Promise.all([
    torrentClient.getState(),
    torrentClient.getDownloadSpeed(),
    prisma.torrent.findMany({
      where: {
        state: {
          in: [TorrentState.Verifying, TorrentState.Downloading],
        },
      },
    }),
    prisma.torrent.aggregate({
      _sum: {
        size: true,
      },
    }),
  ]);

  const allTorrentsSize = allTorrentsSum.size ?? 0n;

  const status = new Markdown();

  if (clientState.paused) {
    status.add`🟠 ${Markdown.italic('Клиент стоит на паузе')}

`;
  }

  status.add`${Markdown.bold('⚡️ Скорость загрузки')}: ${formatSpeed(downloadSpeed)}${
    clientState.downloadSpeedLimit !== null &&
    Markdown.create` (ограничение: ${formatSpeed(clientState.downloadSpeedLimit)})`
  }
${Markdown.bold('💾 Размер всех торрентов')}: ${formatSize(allTorrentsSize)}

`;

  const notFinishedTorrentsText = await formatTorrents(notFinishedTorrents);

  status.add`${
    notFinishedTorrentsText.isEmpty() ? Markdown.italic('Нет активных торрентов') : notFinishedTorrentsText
  }`;

  return new MessageResponse({
    content: status,
    replyMarkup: await callbackDataProvider.buildInlineKeyboard([
      [
        refreshCallbackButton({
          type: TorrentClientCallbackButtonType.OpenStatus,
          isRefresh: true,
        }),
        clientState.paused
          ? callbackButton('▶️', 'Продолжить', {
              type: TorrentClientCallbackButtonType.PauseClient,
              pause: false,
            })
          : callbackButton('⏸', 'Пауза', {
              type: TorrentClientCallbackButtonType.PauseClient,
              pause: true,
            }),
      ],
      [
        addCallbackButton({
          type: TorrentClientCallbackButtonType.AddTorrent,
        }),
        listCallbackButton({
          type: TorrentClientCallbackButtonType.OpenTorrentsList,
        }),
      ],
      [
        callbackButton('🔎', 'Поиск по Rutracker', {
          type: TorrentClientCallbackButtonType.RutrackerSearch,
        }),
      ],
      [
        backCallbackButton({
          type: RootCallbackButtonType.OpenRoot,
        }),
      ],
    ]),
  });
}
