import { Message } from 'node-telegram-bot-api';

import { ResponseEditContext, ResponseSendContext } from 'telegram-bot/utilities/Bot';

export default abstract class Response {
  abstract edit(ctx: ResponseEditContext): Promise<void>;
  abstract send(ctx: ResponseSendContext): Promise<Message>;
}
