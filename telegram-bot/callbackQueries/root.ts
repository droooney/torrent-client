import { CallbackButtonSource } from 'telegram-bot/types/keyboard';

import { getRootResponse } from 'telegram-bot/utilities/response/root';
import { getStatusResponse as getTorrentClientStatusResponse } from 'telegram-bot/utilities/response/torrent-client';

import bot from 'telegram-bot/bot';

bot.handleCallbackQuery(CallbackButtonSource.ROOT_BACK_TO_ROOT, async () => {
  return getRootResponse();
});

bot.handleCallbackQuery(CallbackButtonSource.ROOT_OPEN_TORRENT_CLIENT, async () => {
  return getTorrentClientStatusResponse();
});
