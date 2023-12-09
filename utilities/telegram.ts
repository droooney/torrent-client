/* eslint-disable camelcase */

import { InlineKeyboardMarkup } from 'node-telegram-bot-api';

import { BeautifiedCallbackData, CallbackButtonSource, InlineKeyboard, UglifiedCallbackData } from 'types/telegram';

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
  if (data.source === CallbackButtonSource.TORRENTS_LIST_ITEM) {
    return {
      $: data.source,
      t: data.torrentId,
    };
  }

  if (data.source === CallbackButtonSource.TORRENTS_LIST_PAGE) {
    return {
      $: data.source,
      p: data.page,
    };
  }

  if (data.source === CallbackButtonSource.TORRENT_DELETE || data.source === CallbackButtonSource.TORRENT_REFRESH) {
    return {
      $: data.source,
      t: data.torrentId,
    };
  }

  if (data.source === CallbackButtonSource.TORRENT_PAUSE) {
    return {
      $: data.source,
      t: data.torrentId,
      p: data.pause ? 1 : 0,
    };
  }

  if (data.source === CallbackButtonSource.TORRENT_SET_CRITICAL) {
    return {
      $: data.source,
      t: data.torrentId,
      c: data.critical ? 1 : 0,
    };
  }

  if (data.source === CallbackButtonSource.TORRENT_BACK_TO_LIST) {
    return {
      $: data.source,
    };
  }

  throw new Error('Unrecognized data');
}

export function beautifyCallbackData(data: UglifiedCallbackData): BeautifiedCallbackData {
  if (data.$ === CallbackButtonSource.TORRENTS_LIST_ITEM) {
    return {
      source: data.$,
      torrentId: data.t,
    };
  }

  if (data.$ === CallbackButtonSource.TORRENTS_LIST_PAGE) {
    return {
      source: data.$,
      page: data.p,
    };
  }

  if (data.$ === CallbackButtonSource.TORRENT_DELETE || data.$ === CallbackButtonSource.TORRENT_REFRESH) {
    return {
      source: data.$,
      torrentId: data.t,
    };
  }

  if (data.$ === CallbackButtonSource.TORRENT_PAUSE) {
    return {
      source: data.$,
      torrentId: data.t,
      pause: Boolean(data.p),
    };
  }

  if (data.$ === CallbackButtonSource.TORRENT_SET_CRITICAL) {
    return {
      source: data.$,
      torrentId: data.t,
      critical: Boolean(data.c),
    };
  }

  if (data.$ === CallbackButtonSource.TORRENT_BACK_TO_LIST) {
    return {
      source: data.$,
    };
  }

  throw new Error('Unrecognized data');
}
