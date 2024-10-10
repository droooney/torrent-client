import { TelegramUserState } from '@prisma/client';
import { Markdown } from '@tg-sensei/bot';
import chunk from 'lodash/chunk';
import rutrackerClient from 'rutracker-client/client';

import { ActionsStreamAction, MessageAction } from 'telegram-bot/types/actions';
import { TorrentClientCallbackButtonType } from 'telegram-bot/types/keyboard/torrent-client';

import { getAddTorrentAction } from 'telegram-bot/utilities/actions/torrent-client';
import { backCallbackButton, callbackButton } from 'telegram-bot/utilities/keyboard';
import { formatIndex } from 'utilities/number';
import { formatSize } from 'utilities/size';

import { callbackDataProvider, userDataProvider } from 'telegram-bot/bot';

callbackDataProvider.handle(TorrentClientCallbackButtonType.RutrackerSearch, async ({ user }) => {
  await userDataProvider.setUserData(user.id, {
    ...user.data,
    state: TelegramUserState.SearchRutracker,
  });

  return new MessageAction({
    content: {
      type: 'text',
      text: 'Введите название для поиска на rutracker',
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

userDataProvider.handle(TelegramUserState.SearchRutracker, async ({ message, user }) => {
  await userDataProvider.setUserData(user.id, {
    ...user.data,
    state: TelegramUserState.Waiting,
  });

  const query = message.text ?? '';

  return new ActionsStreamAction(async function* () {
    yield new MessageAction({
      content: {
        type: 'text',
        text: Markdown.create`Запущен поиск на rutracker по строке "${query}"...`,
      },
    });

    const torrents = await rutrackerClient.search(query);

    const topTorrents = torrents.slice(0, 10);

    const text = Markdown.join(
      topTorrents.map(
        (torrent, index) => Markdown.create`🅰️ ${Markdown.bold('Название')}: ${formatIndex(index)} ${torrent.title}
🧑 ${Markdown.bold('Автор')}: ${torrent.author}
💾 ${Markdown.bold('Размер')}: ${formatSize(torrent.size)}
🔼 ${Markdown.bold('Сидов')}: ${torrent.seeds}
🔗 ${Markdown.bold('Ссылка')}: ${torrent.url}`,
      ),
      '\n\n\n',
    );

    yield new MessageAction({
      content: {
        type: 'text',
        text: text.isEmpty() ? 'Результатов не найдено' : text,
        linkPreviewOptions: {
          is_disabled: true,
        },
      },
      replyMarkup: [
        ...chunk(
          topTorrents.map(({ id }, index) =>
            callbackButton(formatIndex(index), '', {
              type: TorrentClientCallbackButtonType.RutrackerSearchAddTorrent,
              torrentId: id,
            }),
          ),
          2,
        ),
        [
          backCallbackButton({
            type: TorrentClientCallbackButtonType.OpenStatus,
          }),
        ],
      ],
    });
  });
});

callbackDataProvider.handle(TorrentClientCallbackButtonType.RutrackerSearchAddTorrent, async ({ data }) => {
  return getAddTorrentAction('separate', () => rutrackerClient.addTorrent(data.torrentId));
});
