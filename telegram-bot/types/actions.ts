import {
  Action as LibAction,
  ActionOnCallbackQueryContext as LibActionOnCallbackQueryContext,
  ActionOnMessageContext as LibActionOnMessageContext,
  ActionsStreamAction as LibActionsStreamAction,
  MessageAction as LibMessageAction,
  NotificationAction as LibNotificationAction,
} from '@tg-sensei/bot';

import { CommandType } from 'telegram-bot/types/commands';
import { CallbackData } from 'telegram-bot/types/keyboard';

import { UserData } from 'telegram-bot/bot';

export type ActionOnCallbackQueryContext = LibActionOnCallbackQueryContext<CommandType, CallbackData, UserData>;

export type ActionOnMessageContext = LibActionOnMessageContext<CommandType, CallbackData, UserData>;

export type Action = LibAction<CommandType, CallbackData, UserData>;

export const ActionsStreamAction = LibActionsStreamAction<CommandType, CallbackData, UserData>;

export type ActionsStreamAction = LibActionsStreamAction<CommandType, CallbackData, UserData>;

export const MessageAction = LibMessageAction<CommandType, CallbackData, UserData>;

export type MessageAction = LibMessageAction<CommandType, CallbackData, UserData>;

export const NotificationAction = LibNotificationAction<CommandType, CallbackData, UserData>;

export type NotificationAction = LibNotificationAction<CommandType, CallbackData, UserData>;
