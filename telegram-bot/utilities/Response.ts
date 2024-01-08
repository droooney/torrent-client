import TelegramBotApi, { CallbackQuery, Message } from 'node-telegram-bot-api';

export interface RespondToCallbackQueryContext {
  query: CallbackQuery;
  api: TelegramBotApi;
}

export interface RespondToMessageContext {
  message: Message;
  api: TelegramBotApi;
}

export type MessageResponse = Response & Required<Pick<Response, 'respondToMessage'>>;

export type CallbackQueryResponse = Response & Required<Pick<Response, 'respondToCallbackQuery'>>;

export default abstract class Response {
  abstract respondToMessage?(ctx: RespondToMessageContext): Promise<void>;
  abstract respondToCallbackQuery?(ctx: RespondToCallbackQueryContext): Promise<void>;
}
