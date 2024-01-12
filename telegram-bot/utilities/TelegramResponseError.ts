import { InlineKeyboard } from 'telegram-bot/types/keyboard';

import CustomError, { CustomErrorOptions, ErrorCode } from 'utilities/CustomError';

export interface TelegramResponseErrorOptions extends CustomErrorOptions {
  keyboard?: InlineKeyboard;
}

export default class TelegramResponseError extends CustomError {
  readonly keyboard?: InlineKeyboard;

  constructor(code: ErrorCode, humanMessage?: string, options?: TelegramResponseErrorOptions) {
    super(code, humanMessage, options);

    this.keyboard = options?.keyboard;
  }
}
