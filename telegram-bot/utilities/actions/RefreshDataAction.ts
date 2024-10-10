import { Action } from 'telegram-bot/types/actions';

import MessageWithNotificationAction from 'telegram-bot/utilities/actions/MessageWithNotificationAction';

export default class RefreshDataAction extends MessageWithNotificationAction {
  constructor(updateAction: Action) {
    super({
      text: 'Данные обновлены',
      updateAction,
    });
  }
}
