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

export function callbackButton(
  icon: string,
  text: string,
  callbackData: BeautifiedCallbackData,
): CallbackInlineKeyboardButton {
  return {
    type: 'callback',
    icon,
    text,
    callbackData,
  };
}

export function backCallbackButton(callbackData: BeautifiedCallbackData): CallbackInlineKeyboardButton {
  return {
    type: 'callback',
    icon: '◀️',
    text: 'Назад',
    callbackData,
  };
}

export function refreshCallbackButton(callbackData: BeautifiedCallbackData): CallbackInlineKeyboardButton {
  return {
    type: 'callback',
    icon: '🔄',
    text: 'Обновить',
    callbackData,
  };
}

export function deleteCallbackButton(callbackData: BeautifiedCallbackData): CallbackInlineKeyboardButton {
  return {
    type: 'callback',
    icon: '🗑',
    text: 'Удалить',
    callbackData,
  };
}

export function confirmDeleteCallbackButton(callbackData: BeautifiedCallbackData): CallbackInlineKeyboardButton {
  return {
    type: 'callback',
    icon: '🗑',
    text: 'Точно удалить?',
    callbackData,
  };
}

export function prepareInlineKeyboard(keyboard: InlineKeyboard): InlineKeyboardMarkup {
  return {
    inline_keyboard: keyboard
      .filter(isTruthy)
      .map((row) =>
        row.filter(isTruthy).map((button) => {
          const fullButtonText = [button.icon, button.text].filter(Boolean).join(' ');

          if (!fullButtonText) {
            throw new CustomError(ErrorCode.WRONG_FORMAT, 'Ошибка добавления клавиатуры');
          }

          const buttonText =
            fullButtonText.length > BUTTON_TEXT_LIMIT
              ? `${fullButtonText.slice(0, BUTTON_TEXT_LIMIT - 1)}…`
              : fullButtonText;

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
