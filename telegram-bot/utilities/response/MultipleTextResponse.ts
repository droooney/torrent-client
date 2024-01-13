import Response, {
  RespondToCallbackQueryContext,
  RespondToMessageContext,
} from 'telegram-bot/utilities/response/Response';
import TextResponse from 'telegram-bot/utilities/response/TextResponse';

export default class MultipleTextResponse extends Response {
  private readonly responses: TextResponse[];

  constructor(responses: [TextResponse, TextResponse, ...TextResponse[]]) {
    super();

    this.responses = responses;
  }

  async respondToCallbackQuery(ctx: RespondToCallbackQueryContext): Promise<void> {
    const { message } = ctx.query;

    if (!message) {
      return;
    }

    for (const [index, response] of this.responses.entries()) {
      if (index === 0) {
        await response.respondToCallbackQuery(ctx);
      } else {
        await response.sendMessage({
          chatId: message.chat.id,
          api: ctx.api,
        });
      }
    }
  }

  async respondToMessage(ctx: RespondToMessageContext): Promise<void> {
    for (const response of this.responses) {
      await response.respondToMessage(ctx);
    }
  }
}
