import { RootCallbackButtonSource } from 'telegram-bot/types/keyboard/root';

import { getRootResponse } from 'telegram-bot/utilities/response/root';
import { getStatusResponse as getTorrentClientStatusResponse } from 'telegram-bot/utilities/response/torrent-client';

import bot from 'telegram-bot/bot';

bot.handleCallbackQuery(RootCallbackButtonSource.BACK_TO_ROOT, async () => {
  return getRootResponse();
});

bot.handleCallbackQuery(RootCallbackButtonSource.OPEN_TORRENT_CLIENT, async () => {
  return getTorrentClientStatusResponse();
});
