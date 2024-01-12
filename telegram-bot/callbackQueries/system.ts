import { SystemCallbackButtonSource } from 'telegram-bot/types/keyboard/system';

import RefreshNotificationResponse from 'telegram-bot/utilities/response/RefreshNotificationResponse';

import bot from 'telegram-bot/bot';
import { getStatusResponse } from 'telegram-bot/responses/system';

bot.handleCallbackQuery(SystemCallbackButtonSource.REFRESH_STATUS, async () => {
  return new RefreshNotificationResponse(await getStatusResponse());
});
