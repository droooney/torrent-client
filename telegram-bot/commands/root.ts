import { TelegramUserState } from '@prisma/client';

import { CommandType } from 'telegram-bot/types/commands';

import { getRootAction } from 'telegram-bot/actions/root';
import bot, { userDataProvider } from 'telegram-bot/bot';

bot.handleCommand(CommandType.Help, async ({ user }) => {
  if (user) {
    await userDataProvider.setUserData(user.id, {
      ...user.data,
      state: TelegramUserState.Waiting,
    });
  }

  return getRootAction();
});
