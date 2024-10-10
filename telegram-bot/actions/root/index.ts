import { TelegramUserState } from '@prisma/client';

import { MessageAction } from 'telegram-bot/types/actions';
import { CommandType } from 'telegram-bot/types/commands';
import { DevicesClientCallbackButtonType } from 'telegram-bot/types/keyboard/devices-client';
import { RootCallbackButtonType } from 'telegram-bot/types/keyboard/root';
import { ScenariosManagerCallbackButtonType } from 'telegram-bot/types/keyboard/scenarios-manager';
import { SystemCallbackButtonType } from 'telegram-bot/types/keyboard/system';
import { TorrentClientCallbackButtonType } from 'telegram-bot/types/keyboard/torrent-client';

import { callbackButton } from 'telegram-bot/utilities/keyboard';

import bot, { callbackDataProvider, userDataProvider } from 'telegram-bot/bot';

bot.handleCommand(CommandType.Help, async ({ user }) => {
  if (user) {
    await userDataProvider.setUserData(user.id, {
      ...user.data,
      state: TelegramUserState.Waiting,
    });
  }

  return getRootAction();
});

userDataProvider.handle(TelegramUserState.First, async ({ user }) => {
  await userDataProvider.setUserData(user.id, {
    ...user.data,
    state: TelegramUserState.Waiting,
  });

  return getRootAction();
});

callbackDataProvider.handle(RootCallbackButtonType.OpenRoot, async () => {
  return getRootAction();
});

async function getRootAction(): Promise<MessageAction> {
  return new MessageAction({
    content: {
      type: 'text',
      text: 'Привет! Я - Страж Дома! Воспользуйся одной из кнопок ниже',
    },
    replyMarkup: [
      [
        callbackButton('💻', 'Система', {
          type: SystemCallbackButtonType.OpenStatus,
        }),
      ],
      [
        callbackButton('🔢', 'Сценарии', {
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
    ],
  });
}
