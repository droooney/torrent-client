import {
  Action,
  ActionOnCallbackQueryContext,
  ActionsStreamAction,
  NotificationAction,
} from 'telegram-bot/types/actions';

export type MessageWithNotificationActionOptions = {
  text: string;
  updateAction: Action;
};

class MessageWithNotificationAction implements Action {
  private readonly text: string;
  private readonly updateAction: Action;

  constructor(options: MessageWithNotificationActionOptions) {
    this.text = options.text;
    this.updateAction = options.updateAction;
  }

  async onCallbackQuery(ctx: ActionOnCallbackQueryContext): Promise<void> {
    const { text, updateAction } = this;

    await new ActionsStreamAction(async function* () {
      yield updateAction;

      yield new NotificationAction({
        text,
      });
    }).onCallbackQuery(ctx);
  }
}

export default MessageWithNotificationAction;
