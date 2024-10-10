import { TelegramUserState } from '@prisma/client';
import torrentClient from 'torrent-client/client';

import { MessageAction } from 'telegram-bot/types/actions';
import { TorrentClientCallbackButtonType } from 'telegram-bot/types/keyboard/torrent-client';

import { getAddTorrentAction } from 'telegram-bot/utilities/actions/torrent-client';
import { tryLoadTorrentDocument } from 'telegram-bot/utilities/documents';
import { backCallbackButton } from 'telegram-bot/utilities/keyboard';

import { callbackDataProvider, userDataProvider } from 'telegram-bot/bot';

callbackDataProvider.handle(TorrentClientCallbackButtonType.AddTorrent, async ({ user }) => {
  await userDataProvider.setUserData(user.id, {
    ...user.data,
    state: TelegramUserState.AddTorrent,
  });

  return new MessageAction({
    content: {
      type: 'text',
      text: 'Отправьте торрент или magnet-ссылку',
    },
    replyMarkup: [
      [
        backCallbackButton({
          type: TorrentClientCallbackButtonType.OpenStatus,
        }),
      ],
    ],
  });
});

userDataProvider.handle(TelegramUserState.AddTorrent, async ({ message, user }) => {
  const { text } = message;

  await userDataProvider.setUserData(user.id, {
    ...user.data,
    state: TelegramUserState.Waiting,
  });

  return getAddTorrentAction('linked', async () => {
    let torrent = await tryLoadTorrentDocument(message);

    if (!torrent && text) {
      torrent = await torrentClient.addTorrent({
        type: 'magnet',
        magnet: text,
      });
    }

    return torrent;
  });
});
