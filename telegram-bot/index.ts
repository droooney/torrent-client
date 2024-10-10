import * as util from 'node:util';

import { blue, green } from 'colors/safe';

import { runMain } from 'utilities/process';

import bot from 'telegram-bot/bot';

import './actions/root';
import './actions/system';
import './actions/scenarios-manager';
import './actions/devices-client';
import './actions/torrent-client';

util.inspect.defaultOptions.depth = null;

console.log(blue('Bot started'));

runMain(async () => {
  await bot.start();

  console.log(green('Bot listening...'));
});
