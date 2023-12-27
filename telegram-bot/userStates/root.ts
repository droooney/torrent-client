import { TelegramUserState } from '@prisma/client';

import { getRootResponse } from 'telegram-bot/utilities/response/root';

import bot from 'telegram-bot/bot';

bot.handleUserState(TelegramUserState.First, async (ctx) => {
  await ctx.updateUserState({
    state: TelegramUserState.Waiting,
  });

  return getRootResponse();
});
