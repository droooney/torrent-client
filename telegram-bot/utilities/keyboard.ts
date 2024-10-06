import { CallbackData, CallbackInlineKeyboardButton } from 'telegram-bot/types/keyboard';

export function callbackButton(icon: string, text: string, callbackData: CallbackData): CallbackInlineKeyboardButton {
  return {
    type: 'callbackData',
    text: [icon, text].filter(Boolean).join(' '),
    callbackData,
  };
}

export function backCallbackButton(callbackData: CallbackData): CallbackInlineKeyboardButton {
  return callbackButton('◀️', 'Назад', callbackData);
}

export function refreshCallbackButton(callbackData: CallbackData): CallbackInlineKeyboardButton {
  return callbackButton('🔄', 'Обновить', callbackData);
}

export function deleteCallbackButton(
  withDeleteConfirm: boolean,
  confirmCallbackData: CallbackData,
  deleteCallbackData: CallbackData,
): CallbackInlineKeyboardButton {
  return withDeleteConfirm
    ? callbackButton('🗑', 'Точно удалить?', confirmCallbackData)
    : callbackButton('🗑', 'Удалить', deleteCallbackData);
}

export function addCallbackButton(callbackData: CallbackData): CallbackInlineKeyboardButton {
  return callbackButton('➕', 'Добавить', callbackData);
}

export function listCallbackButton(callbackData: CallbackData): CallbackInlineKeyboardButton {
  return callbackButton('📜', 'Список', callbackData);
}
