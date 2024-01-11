import * as util from 'node:util';

import { blue, green } from 'colors/safe';

import { runMain } from 'utilities/process';

import bot from 'telegram-bot/bot';

import './commands';
import './userStates';
import './callbackQueries';

util.inspect.defaultOptions.depth = null;

console.log(blue('Bot started'));

runMain(async () => {
  await bot.start();

  console.log(green('Bot listening...'));
});
