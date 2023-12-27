/* eslint-disable camelcase */

import { InlineKeyboardMarkup } from 'node-telegram-bot-api';

import { beautifyCallbackDataMapper, uglifyCallbackDataMapper } from 'telegram-bot/constants/callbackData';

import { BeautifiedCallbackData, InlineKeyboard, UglifiedCallbackData } from 'telegram-bot/types/keyboard';

export function prepareInlineKeyboard(keyboard: InlineKeyboard): InlineKeyboardMarkup {
  return {
    inline_keyboard: keyboard.map((row) =>
      row.map((button) => {
        if (button.type === 'callback') {
          const callbackData: UglifiedCallbackData = uglifyCallbackData(button.callbackData);
          const callbackDataString = JSON.stringify(callbackData);

          if (callbackDataString.length > 64) {
            throw new Error(`Callback data too long (${callbackDataString})`);
          }

          return {
            text: button.text,
            callback_data: callbackDataString,
          };
        }

        return {
          text: button.text,
          url: button.url,
        };
      }),
    ),
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
