import { CallbackData, InlineKeyboardButton } from 'telegram-bot/types/keyboard';
import { DevicesClientCallbackButtonType } from 'telegram-bot/types/keyboard/devices-client';

export function callbackButton(icon: string, text: string, callbackData: CallbackData): InlineKeyboardButton {
  return {
    type: 'callbackData',
    text: [icon, text].filter(Boolean).join(' '),
    callbackData,
  };
}

export function backToCallbackButton(text: string, callbackData: CallbackData): InlineKeyboardButton {
  return callbackButton('◀️', text, callbackData);
}

export function backCallbackButton(callbackData: CallbackData): InlineKeyboardButton {
  return backToCallbackButton('Назад', callbackData);
}

export function refreshCallbackButton(callbackData: CallbackData): InlineKeyboardButton {
  return callbackButton('🔄', 'Обновить', callbackData);
}

export function deleteCallbackButton(
  withDeleteConfirm: boolean,
  confirmCallbackData: CallbackData,
  deleteCallbackData: CallbackData,
): InlineKeyboardButton {
  return withDeleteConfirm
    ? callbackButton('🗑', 'Точно удалить?', confirmCallbackData)
    : callbackButton('🗑', 'Удалить', deleteCallbackData);
}

export function addCallbackButton(callbackData: CallbackData): InlineKeyboardButton {
  return callbackButton('➕', 'Добавить', callbackData);
}

export function listCallbackButton(callbackData: CallbackData): InlineKeyboardButton {
  return callbackButton('📜', 'Список', callbackData);
}

export function activateCallbackButton(
  isActive: boolean,
  getCallbackData: (isActive: boolean) => CallbackData,
): InlineKeyboardButton {
  return callbackButton(isActive ? '🔴' : '🟢', isActive ? 'Выключить' : 'Включить', getCallbackData(isActive));
}
