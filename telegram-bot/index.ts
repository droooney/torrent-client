import * as util from 'node:util';

import { blue, green } from 'colors/safe';

import { prepareErrorForLogging } from 'utilities/error';

import bot from 'telegram-bot/bot';

import './commands';
import './userStates';
import './callbackQueries';

util.inspect.defaultOptions.depth = null;

console.log(blue('Bot started'));

(async () => {
  await bot.start();

  console.log(green('Bot listening...'));
})().catch((err) => {
  console.log(prepareErrorForLogging(err));

  process.exit(1);
});
