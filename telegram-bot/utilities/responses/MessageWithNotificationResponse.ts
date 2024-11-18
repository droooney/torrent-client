import { AnyUpdateContext, NotificationResponse, Response, ResponsesStreamResponse } from '@tg-sensei/bot';

export type MessageWithNotificationResponseOptions = {
  text: string;
  updateResponse: Response;
};

class MessageWithNotificationResponse implements Response {
  private readonly text: string;
  private readonly updateResponse: Response;

  constructor(options: MessageWithNotificationResponseOptions) {
    this.text = options.text;
    this.updateResponse = options.updateResponse;
  }

  async respond(ctx: AnyUpdateContext): Promise<void> {
    const { text, updateResponse } = this;

    await ctx.respondWith(
      new ResponsesStreamResponse(async function* () {
        yield updateResponse;

        yield new NotificationResponse({
          text,
        });
      }),
    );
  }
}

export default MessageWithNotificationResponse;
