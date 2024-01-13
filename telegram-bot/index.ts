import * as util from 'node:util';

import { blue, green, yellow } from 'colors/safe';

import { runMain } from 'utilities/process';

import bot from 'telegram-bot/bot';

import './commands';
import './userStates';
import './callbackQueries';

util.inspect.defaultOptions.depth = null;

console.log(blue('Bot started'));

runMain(async () => {
  await bot.start();

  const unhandledButtonSources = bot.getUnhandledCallbackButtonSources();
  const unhandledUserStates = bot.getUnhandledUserStates();
  const unhandledCommands = bot.getUnhandledCommands();

  if (unhandledButtonSources.length > 0) {
    console.log(yellow(`Необработанные кнопки: ${unhandledButtonSources.join(', ')}`));
  }

  if (unhandledUserStates.length > 0) {
    console.log(yellow(`Необработанные состояния: ${unhandledUserStates.join(', ')}`));
  }

  if (unhandledCommands.length > 0) {
    console.log(yellow(`Необработанные команды: ${unhandledCommands.join(', ')}`));
  }

  console.log(green('Bot listening...'));
});
