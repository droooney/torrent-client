import Bot from 'telegram-bot/utilities/Bot';

if (!process.env.TELEGRAM_BOT_TOKEN) {
  console.error('No telegram bot token');

  process.exit(1);
}

const bot = new Bot({
  token: process.env.TELEGRAM_BOT_TOKEN,
  usernameWhitelist: process.env.USERNAME_WHITELIST?.split(',').filter(Boolean) ?? [],
});

export default bot;
