import { CallbackButtonSource } from 'telegram-bot/types/keyboard';

import Response from 'telegram-bot/utilities/Response';

export async function getRootResponse(): Promise<Response> {
  return new Response({
    text: 'Привет! Я - Страж Дома! Воспользуйся одной из кнопок ниже',
    keyboard: [
      [
        {
          type: 'callback',
          text: '💻 Система',
          callbackData: {
            source: CallbackButtonSource.ROOT_OPEN_SYSTEM,
          },
        },
      ],
      [
        {
          type: 'callback',
          text: '📽 Торрент клиент',
          callbackData: {
            source: CallbackButtonSource.ROOT_OPEN_TORRENT_CLIENT,
          },
        },
      ],
    ],
  });
}
