import { SystemCallbackButtonSource } from 'telegram-bot/types/keyboard/system';

import RefreshNotificationResponse from 'telegram-bot/utilities/response/RefreshNotificationResponse';
import { getStatusResponse } from 'telegram-bot/utilities/response/system';

import bot from 'telegram-bot/bot';

bot.handleCallbackQuery(SystemCallbackButtonSource.REFRESH_STATUS, async () => {
  return new RefreshNotificationResponse(await getStatusResponse());
});
