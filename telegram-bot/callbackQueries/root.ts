import { RootCallbackButtonSource } from 'telegram-bot/types/keyboard/root';

import bot from 'telegram-bot/bot';
import { getStatusResponse as getDevicesStatusResponse } from 'telegram-bot/responses/devices-client';
import { getRootResponse } from 'telegram-bot/responses/root';
import { getStatusResponse as getSystemStatusResponse } from 'telegram-bot/responses/system';
import { getStatusResponse as getTorrentClientStatusResponse } from 'telegram-bot/responses/torrent-client';

bot.handleCallbackQuery(RootCallbackButtonSource.BACK_TO_ROOT, async () => {
  return getRootResponse();
});

bot.handleCallbackQuery(RootCallbackButtonSource.OPEN_SYSTEM, async () => {
  return getSystemStatusResponse();
});

bot.handleCallbackQuery(RootCallbackButtonSource.OPEN_DEVICES, async () => {
  return getDevicesStatusResponse();
});

bot.handleCallbackQuery(RootCallbackButtonSource.OPEN_TORRENT_CLIENT, async () => {
  return getTorrentClientStatusResponse();
});
