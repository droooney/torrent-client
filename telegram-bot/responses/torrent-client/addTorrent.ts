import { TelegramUserState } from '@prisma/client';
import { MessageResponse } from '@tg-sensei/bot';
import torrentClient from 'torrent-client/client';

import { TorrentClientCallbackButtonType } from 'telegram-bot/types/keyboard/torrent-client';

import { tryLoadTorrentDocument } from 'telegram-bot/utilities/documents';
import { backCallbackButton } from 'telegram-bot/utilities/keyboard';
import { getAddTorrentResponse } from 'telegram-bot/utilities/responses/torrent-client';

import { callbackDataProvider, messageUserDataProvider } from 'telegram-bot/bot';

callbackDataProvider.handle(TorrentClientCallbackButtonType.AddTorrent, async (ctx) => {
  const { user } = ctx;

  await user.updateData({
    state: TelegramUserState.AddTorrent,
  });

  await ctx.respondWith(
    new MessageResponse({
      content: 'Отправьте торрент или magnet-ссылку',
      replyMarkup: await callbackDataProvider.buildInlineKeyboard([
        [
          backCallbackButton({
            type: TorrentClientCallbackButtonType.OpenStatus,
          }),
        ],
      ]),
    }),
  );
});

messageUserDataProvider.handle(TelegramUserState.AddTorrent, async (ctx) => {
  const { message, user } = ctx;
  const { text } = message;

  await user.updateData({
    state: TelegramUserState.Waiting,
  });

  await ctx.respondWith(
    getAddTorrentResponse('linked', async () => {
      let torrent = await tryLoadTorrentDocument(message);

      if (!torrent && text) {
        torrent = await torrentClient.addTorrent({
          type: 'magnet',
          magnet: text,
        });
      }

      return torrent;
    }),
  );
});
