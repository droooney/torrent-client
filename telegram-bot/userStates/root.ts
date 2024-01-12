import { TelegramUserState } from '@prisma/client';

import bot from 'telegram-bot/bot';
import { getRootResponse } from 'telegram-bot/responses/root';

bot.handleUserState(TelegramUserState.First, async (ctx) => {
  await ctx.updateUserState({
    state: TelegramUserState.Waiting,
  });

  return getRootResponse();
});
