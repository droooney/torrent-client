/* eslint-disable camelcase */

import { InlineKeyboardMarkup } from 'node-telegram-bot-api';

import { beautifyCallbackDataMapper, uglifyCallbackDataMapper } from 'telegram-bot/constants/callbackData';

import {
  BeautifiedCallbackData,
  CallbackInlineKeyboardButton,
  InlineKeyboard,
  UglifiedCallbackData,
} from 'telegram-bot/types/keyboard';

import CustomError, { ErrorCode } from 'utilities/CustomError';
import { isTruthy } from 'utilities/is';

const BUTTON_TEXT_LIMIT = 120;

export function callbackButton(text: string, callbackData: BeautifiedCallbackData): CallbackInlineKeyboardButton {
  return {
    type: 'callback',
    text,
    callbackData,
  };
}

export function prepareInlineKeyboard(keyboard: InlineKeyboard): InlineKeyboardMarkup {
  return {
    inline_keyboard: keyboard
      .filter(isTruthy)
      .map((row) =>
        row.filter(isTruthy).map((button) => {
          const buttonText =
            button.text.length > BUTTON_TEXT_LIMIT ? `${button.text.slice(0, BUTTON_TEXT_LIMIT - 1)}…` : button.text;

          if (button.type === 'url') {
            return {
              text: buttonText,
              url: button.url,
            };
          }

          const callbackData: UglifiedCallbackData = uglifyCallbackData(button.callbackData);
          const callbackDataString = JSON.stringify(callbackData);

          if (callbackDataString.length > 64) {
            throw new CustomError(ErrorCode.WRONG_FORMAT, 'Ошибка добавления клавиатуры', {
              message: `Callback data too long (${callbackDataString})`,
            });
          }

          return {
            text: buttonText,
            callback_data: callbackDataString,
          };
        }),
      )
      .filter((row) => row.length > 0),
  };
}

export function uglifyCallbackData(data: BeautifiedCallbackData): UglifiedCallbackData {
  return {
    $: data.source,
    // @ts-ignore
    ...uglifyCallbackDataMapper[data.source]?.(data),
  };
}

export function beautifyCallbackData(data: UglifiedCallbackData): BeautifiedCallbackData {
  return {
    source: data.$,
    // @ts-ignore
    ...beautifyCallbackDataMapper[data.$]?.(data),
  };
}
