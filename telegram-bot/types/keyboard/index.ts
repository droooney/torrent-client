import { z } from 'zod';

import {
  RootBeautifiedCallbackData,
  RootCallbackButtonSource,
  rootCallbackDataSchema,
} from 'telegram-bot/types/keyboard/root';
import {
  TorrentClientBeautifiedCallbackData,
  TorrentClientCallbackButtonSource,
  torrentClientCallbackDataSchema,
} from 'telegram-bot/types/keyboard/torrent-client';

export type InlineKeyboard = ((InlineKeyboardButton | null | undefined | false)[] | null | undefined | false)[];

export type CallbackButtonSource = RootCallbackButtonSource | TorrentClientCallbackButtonSource;

export const callbackDataSchema = z.union([rootCallbackDataSchema, torrentClientCallbackDataSchema]);

export type UglifiedCallbackData = z.infer<typeof callbackDataSchema>;

export type UglifiedCallbackDataBySource<Source extends CallbackButtonSource> = Extract<
  UglifiedCallbackData,
  { $: Source }
>;

export type UglifiedCallbackDataSourceWithData<ButtonSource extends CallbackButtonSource> = {
  [Source in ButtonSource]: Exclude<keyof UglifiedCallbackDataBySource<Source>, '$'> extends never ? never : Source;
}[ButtonSource];

export type BeautifiedCallbackData = RootBeautifiedCallbackData | TorrentClientBeautifiedCallbackData;

export type BeautifiedCallbackDataBySource<Source extends CallbackButtonSource> = Extract<
  BeautifiedCallbackData,
  { source: Source }
>;

export type BeautifiedCallbackDataSourceWithData<ButtonSource extends CallbackButtonSource> = {
  [Source in ButtonSource]: Exclude<keyof BeautifiedCallbackDataBySource<Source>, 'source'> extends never
    ? never
    : Source;
}[ButtonSource];

export interface BaseInlineKeyboardButton {
  // TODO: add icon
  text: string;
}

export interface CallbackInlineKeyboardButton extends BaseInlineKeyboardButton {
  type: 'callback';
  callbackData: BeautifiedCallbackData;
}

export interface UrlInlineKeyboardButton extends BaseInlineKeyboardButton {
  type: 'url';
  url: string;
}

export type InlineKeyboardButton = CallbackInlineKeyboardButton | UrlInlineKeyboardButton;

export type UglifyCallbackDataMapper<ButtonSource extends CallbackButtonSource> = {
  [Source in BeautifiedCallbackDataSourceWithData<ButtonSource>]: (
    beautifiedData: BeautifiedCallbackDataBySource<Source>,
  ) => Omit<UglifiedCallbackDataBySource<Source>, '$'>;
};

export type BeautifyCallbackDataMapper<ButtonSource extends CallbackButtonSource> = {
  [Source in UglifiedCallbackDataSourceWithData<ButtonSource>]: (
    uglifiedData: UglifiedCallbackDataBySource<Source>,
  ) => Omit<BeautifiedCallbackDataBySource<Source>, 'source'>;
};
