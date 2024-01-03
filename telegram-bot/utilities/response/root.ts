import { RootCallbackButtonSource } from 'telegram-bot/types/keyboard/root';

import Response from 'telegram-bot/utilities/Response';
import TextResponse from 'telegram-bot/utilities/TextResponse';
import { callbackButton } from 'telegram-bot/utilities/keyboard';

export async function getRootResponse(): Promise<Response> {
  return new TextResponse({
    text: 'Привет! Я - Страж Дома! Воспользуйся одной из кнопок ниже',
    keyboard: [
      [
        callbackButton('💻 Система', {
          source: RootCallbackButtonSource.OPEN_SYSTEM,
        }),
      ],
      [
        callbackButton('📽 Торрент клиент', {
          source: RootCallbackButtonSource.OPEN_TORRENT_CLIENT,
        }),
      ],
    ],
  });
}
