import * as util from 'node:util';

import { blue, green } from 'colors/safe';

import { CommandType } from 'telegram-bot/types/commands';

import { runMain } from 'utilities/process';

import bot, { commandsProvider } from 'telegram-bot/bot';

import 'telegram-bot/responses/root';
import 'telegram-bot/responses/system';
import 'telegram-bot/responses/scenarios-manager';
import 'telegram-bot/responses/devices-client';
import 'telegram-bot/responses/torrent-client';

util.inspect.defaultOptions.depth = null;

console.log(blue('Bot started'));

runMain(async () => {
  await Promise.all([
    bot.start(),
    bot.api.setMyCommands({
      commands: commandsProvider.prepareCommands({
        [CommandType.Help]: 'Помощь',
      }),
    }),
  ]);

  console.log(green('Bot listening...'));
});
