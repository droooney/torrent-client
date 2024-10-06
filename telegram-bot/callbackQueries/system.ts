import { SystemCallbackButtonType } from 'telegram-bot/types/keyboard/system';

import RefreshDataAction from 'telegram-bot/utilities/actions/RefreshDataAction';

import { getStatusAction } from 'telegram-bot/actions/system';
import { callbackDataProvider } from 'telegram-bot/bot';

callbackDataProvider.handle(SystemCallbackButtonType.RefreshStatus, async () => {
  return new RefreshDataAction(await getStatusAction());
});
