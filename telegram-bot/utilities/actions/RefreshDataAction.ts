import { MessageAction } from 'telegram-bot/types/actions';

import MessageWithNotificationAction from 'telegram-bot/utilities/actions/MessageWithNotificationAction';

export default class RefreshDataAction extends MessageWithNotificationAction {
  constructor(updateAction: MessageAction) {
    super({
      text: 'Данные обновлены',
      updateAction,
    });
  }
}
