import ImmediateTextResponse from 'telegram-bot/utilities/response/ImmediateTextResponse';
import Response, { RespondToCallbackQueryContext } from 'telegram-bot/utilities/response/Response';
import CustomError, { ErrorCode } from 'utilities/CustomError';

export interface NotificationResponseOptions {
  text: string;
  updateMessage?: ImmediateTextResponse;
}

export default class NotificationResponse extends Response {
  private readonly text: string;
  private readonly updateMessage?: ImmediateTextResponse;

  constructor(options: NotificationResponseOptions) {
    super();

    this.text = options.text;
    this.updateMessage = options.updateMessage;
  }

  async respondToCallbackQuery(ctx: RespondToCallbackQueryContext): Promise<void> {
    await Promise.all([
      ctx.bot.answerCallbackQuery(ctx.query.id, this.text),
      (async () => {
        try {
          if (ctx.query.message && this.updateMessage) {
            await ctx.bot.editMessage(ctx.query.message, this.updateMessage);
          }
        } catch (err) {
          if (!(err instanceof CustomError) || err.code !== ErrorCode.SAME_CONTENT) {
            throw err;
          }
        }
      })(),
    ]);
  }
}
