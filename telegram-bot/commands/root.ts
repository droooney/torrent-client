import { TelegramUserState } from '@prisma/client';

import { CommandType } from 'telegram-bot/constants/commands';

import { getRootResponse } from 'telegram-bot/utilities/response/root';

import bot from 'telegram-bot/bot';

bot.handleCommand(CommandType.HELP, async (ctx) => {
  await ctx.updateUserState({
    state: TelegramUserState.Waiting,
  });

  return getRootResponse();
});
