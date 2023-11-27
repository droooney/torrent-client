/* eslint-disable camelcase */

import 'common/utilities/importEnv';

import * as util from 'node:util';

import { blue, green } from 'colors/safe';

import TelegramBot, { User } from 'node-telegram-bot-api';

import db from 'telegram-bot/db';
import { UserState } from 'telegram-bot/db/database';

util.inspect.defaultOptions.depth = null;

const USERNAME_WHITELIST: (string | undefined)[] = process.env.USERNAME_WHITELIST?.split(',').filter(Boolean) ?? [];

const isUserAllowed = (user: User): boolean => {
  return USERNAME_WHITELIST.includes(user.username);
};

if (!process.env.TELEGRAM_BOT_TOKEN) {
  console.error('No telegram bot token');

  process.exit(1);
}

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, {
  polling: {
    autoStart: false,
  },
});

bot.on('message', async (message) => {
  const { from: user } = message;

  if (!user || !isUserAllowed(user)) {
    return;
  }

  const userId = user.id;
  const userData = db.getUserData(userId);
  let userState = userData.state;

  const sendText = async (text: string): Promise<void> => {
    await bot.sendMessage(userId, text);
  };

  const changeUserState = (state: UserState): void => {
    db.setUserData(userId, { state });
  };

  console.log({
    message,
    userState,
  });

  const prevState = userState;

  // before state change
  if (userState.type === 'first') {
    await sendText('Привет! Я - ТоррентБот. Добавляйте торренты, чтобы поставить их на скачивание');

    changeUserState({
      type: 'waiting',
    });
  }

  userState = db.getUserData(userId).state;

  // after state change
  if (userState !== prevState) {
    // empty
  }
});

console.log(blue('Bot started'));

(async () => {
  await bot.startPolling();

  console.log(green('Bot listening...'));
})();
