import { TelegramUserState } from '@prisma/client';
import { MessageResponse } from '@tg-sensei/bot';

import { CommandType } from 'telegram-bot/types/commands';
import { DevicesClientCallbackButtonType } from 'telegram-bot/types/keyboard/devices-client';
import { RootCallbackButtonType } from 'telegram-bot/types/keyboard/root';
import { ScenariosManagerCallbackButtonType } from 'telegram-bot/types/keyboard/scenarios-manager';
import { SystemCallbackButtonType } from 'telegram-bot/types/keyboard/system';
import { TorrentClientCallbackButtonType } from 'telegram-bot/types/keyboard/torrent-client';

import { callbackButton } from 'telegram-bot/utilities/keyboard';

import { callbackDataProvider, commandsProvider, messageUserDataProvider } from 'telegram-bot/bot';

commandsProvider.handle(CommandType.Help, async (ctx) => {
  await ctx.respondWith(await getRootResponse());
});

messageUserDataProvider.handle(TelegramUserState.First, async (ctx) => {
  const { user } = ctx;

  await user.updateData({
    state: TelegramUserState.Waiting,
  });

  await ctx.respondWith(await getRootResponse());
});

callbackDataProvider.handle(RootCallbackButtonType.OpenRoot, async () => {
  return getRootResponse();
});

async function getRootResponse(): Promise<MessageResponse> {
  return new MessageResponse({
    content: 'Привет! Я - Страж Дома! Воспользуйся одной из кнопок ниже',
    replyMarkup: await callbackDataProvider.buildInlineKeyboard([
      [
        callbackButton('💻', 'Система', {
          type: SystemCallbackButtonType.OpenStatus,
        }),
      ],
      [
        callbackButton('📋', 'Сценарии', {
          type: ScenariosManagerCallbackButtonType.OpenStatus,
        }),
      ],
      [
        callbackButton('📺', 'Устройства', {
          type: DevicesClientCallbackButtonType.OpenStatus,
        }),
      ],
      [
        callbackButton('📽', 'Торрент клиент', {
          type: TorrentClientCallbackButtonType.OpenStatus,
        }),
      ],
    ]),
  });
}
