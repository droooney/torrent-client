import { TelegramUserState } from '@prisma/client';
import { Markdown, MessageResponse, ResponsesStreamResponse } from '@tg-sensei/bot';
import chunk from 'lodash/chunk';
import rutrackerClient from 'rutracker-client/client';

import { TorrentClientCallbackButtonType } from 'telegram-bot/types/keyboard/torrent-client';

import { backCallbackButton, callbackButton } from 'telegram-bot/utilities/keyboard';
import { getAddTorrentResponse } from 'telegram-bot/utilities/responses/torrent-client';
import { formatIndex } from 'utilities/number';
import { formatSize } from 'utilities/size';

import { callbackDataProvider, messageUserDataProvider } from 'telegram-bot/bot';

callbackDataProvider.handle(TorrentClientCallbackButtonType.RutrackerSearch, async (ctx) => {
  const { user } = ctx;

  await user.updateData({
    state: TelegramUserState.SearchRutracker,
  });

  await ctx.respondWith(
    new MessageResponse({
      content: 'Введите название для поиска на rutracker',
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

messageUserDataProvider.handle(TelegramUserState.SearchRutracker, async (ctx) => {
  const { message, user } = ctx;

  await user.updateData({
    state: TelegramUserState.Waiting,
  });

  const query = message.text ?? '';

  await ctx.respondWith(
    new ResponsesStreamResponse(async function* () {
      yield new MessageResponse({
        content: Markdown.create`Запущен поиск на rutracker по строке "${query}"...`,
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

      yield new MessageResponse({
        content: {
          type: 'text',
          text: text.isEmpty() ? 'Результатов не найдено' : text,
          linkPreviewOptions: {
            is_disabled: true,
          },
        },
        replyMarkup: await callbackDataProvider.buildInlineKeyboard([
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
        ]),
      });
    }),
  );
});

callbackDataProvider.handle(TorrentClientCallbackButtonType.RutrackerSearchAddTorrent, async (ctx) => {
  await ctx.respondWith(
    getAddTorrentResponse('separate', () => rutrackerClient.addTorrent(ctx.callbackData.torrentId)),
  );
});
