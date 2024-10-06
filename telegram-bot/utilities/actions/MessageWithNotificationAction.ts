import { ActionsBatchAction } from '@tg-sensei/bot';

import { Action, ActionOnCallbackQueryContext, MessageAction, NotificationAction } from 'telegram-bot/types/actions';

export type MessageWithNotificationActionOptions = {
  text: string;
  updateAction: MessageAction;
};

class MessageWithNotificationAction implements Action {
  private readonly text: string;
  private readonly updateAction: MessageAction;

  constructor(options: MessageWithNotificationActionOptions) {
    this.text = options.text;
    this.updateAction = options.updateAction;
  }

  async onCallbackQuery(ctx: ActionOnCallbackQueryContext): Promise<void> {
    await new ActionsBatchAction(() => [
      this.updateAction,
      new NotificationAction({
        text: this.text,
      }),
    ]).onCallbackQuery(ctx);
  }
}

export default MessageWithNotificationAction;
