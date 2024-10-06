import { MessageAction } from 'telegram-bot/types/actions';
import { RootCallbackButtonType } from 'telegram-bot/types/keyboard/root';

import { callbackButton } from 'telegram-bot/utilities/keyboard';

export async function getRootAction(): Promise<MessageAction> {
  return new MessageAction({
    content: {
      type: 'text',
      text: 'Привет! Я - Страж Дома! Воспользуйся одной из кнопок ниже',
    },
    replyMarkup: [
      [
        callbackButton('💻', 'Система', {
          type: RootCallbackButtonType.OpenSystem,
        }),
      ],
      [
        callbackButton('📺', 'Устройства', {
          type: RootCallbackButtonType.OpenDevices,
        }),
      ],
      [
        callbackButton('📽', 'Торрент клиент', {
          type: RootCallbackButtonType.OpenTorrentClient,
        }),
      ],
    ],
  });
}
