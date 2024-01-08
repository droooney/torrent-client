import TelegramBotApi, { Message } from 'node-telegram-bot-api';

import Response, {
  RespondToCallbackQueryContext,
  RespondToMessageContext,
} from 'telegram-bot/utilities/response/Response';

export interface EditMessageContext {
  message: Message;
  api: TelegramBotApi;
}

export interface SendMessageContext {
  chatId: number;
  replyToMessageId?: number;
  api: TelegramBotApi;
}

export default abstract class TextResponse extends Response {
  abstract editMessage(ctx: EditMessageContext): Promise<Message>;
  abstract sendMessage(ctx: SendMessageContext): Promise<Message>;

  async respondToCallbackQuery(ctx: RespondToCallbackQueryContext): Promise<void> {
    const { message } = ctx.query;

    if (!message) {
      return;
    }

    await this.editMessage({
      message,
      api: ctx.api,
    });
  }

  async respondToMessage(ctx: RespondToMessageContext): Promise<void> {
    await this.sendMessage({
      chatId: ctx.message.chat.id,
      replyToMessageId: ctx.message.message_id,
      api: ctx.api,
    });
  }
}
