import TelegramBot from 'node-telegram-bot-api';

if (!process.env.TELEGRAM_BOT_TOKEN) {
  console.error('No telegram bot token');

  process.exit(1);
}

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, {
  polling: {
    autoStart: false,
  },
});

export default bot;
