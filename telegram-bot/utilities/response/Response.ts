import TelegramBotApi, { CallbackQuery, Message } from 'node-telegram-bot-api';

import Bot from 'telegram-bot/utilities/Bot';

export interface RespondToCallbackQueryContext {
  query: CallbackQuery;
  bot: Bot;
  api: TelegramBotApi;
}

export interface RespondToMessageContext {
  message: Message;
  bot: Bot;
  api: TelegramBotApi;
}

export type MessageResponse = Response & Required<Pick<Response, 'respondToMessage'>>;

export type CallbackQueryResponse = Response & Required<Pick<Response, 'respondToCallbackQuery'>>;

export default class Response {
  respondToMessage?(ctx: RespondToMessageContext): Promise<void>;
  respondToCallbackQuery?(ctx: RespondToCallbackQueryContext): Promise<void>;
}
