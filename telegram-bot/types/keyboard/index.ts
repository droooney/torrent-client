import { InlineKeyboard as LibInlineKeyboard, InlineKeyboardButton as LibInlineKeyboardButton } from '@tg-sensei/bot';
import { z } from 'zod';

import { devicesClientCallbackDataSchema } from 'telegram-bot/types/keyboard/devices-client';
import { rootCallbackDataSchema } from 'telegram-bot/types/keyboard/root';
import { scenariosManagerCallbackDataSchema } from 'telegram-bot/types/keyboard/scenarios-manager';
import { systemCallbackDataSchema } from 'telegram-bot/types/keyboard/system';
import { torrentClientCallbackDataSchema } from 'telegram-bot/types/keyboard/torrent-client';

export const callbackDataSchema = z.union([
  rootCallbackDataSchema,
  systemCallbackDataSchema,
  scenariosManagerCallbackDataSchema,
  devicesClientCallbackDataSchema,
  torrentClientCallbackDataSchema,
]);

export type CallbackData = z.TypeOf<typeof callbackDataSchema>;

export type InlineKeyboardButton = LibInlineKeyboardButton<CallbackData>;

export type InlineKeyboard = LibInlineKeyboard<CallbackData>;
