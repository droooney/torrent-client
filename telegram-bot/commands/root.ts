import { TelegramUserState } from '@prisma/client';

import { CommandType } from 'telegram-bot/constants/commands';

import bot from 'telegram-bot/bot';
import { getRootResponse } from 'telegram-bot/responses/root';

bot.handleCommand(CommandType.HELP, async (ctx) => {
  await ctx.updateUserState({
    state: TelegramUserState.Waiting,
  });

  return getRootResponse();
});
