import { Markdown } from '@tg-sensei/bot';

import { MessageAction } from 'telegram-bot/types/actions';
import { DevicesClientCallbackButtonType } from 'telegram-bot/types/keyboard/devices-client';
import { RootCallbackButtonType } from 'telegram-bot/types/keyboard/root';

import RefreshDataAction from 'telegram-bot/utilities/actions/RefreshDataAction';
import {
  addCallbackButton,
  backCallbackButton,
  listCallbackButton,
  refreshCallbackButton,
} from 'telegram-bot/utilities/keyboard';

import { callbackDataProvider } from 'telegram-bot/bot';

callbackDataProvider.handle(DevicesClientCallbackButtonType.OpenStatus, async () => {
  return getStatusAction();
});

callbackDataProvider.handle(DevicesClientCallbackButtonType.RefreshStatus, async () => {
  return new RefreshDataAction(await getStatusAction());
});

async function getStatusAction(): Promise<MessageAction> {
  return new MessageAction({
    content: {
      type: 'text',
      text: Markdown.italic('Нет устройств онлайн'),
    },
    replyMarkup: [
      [
        refreshCallbackButton({
          type: DevicesClientCallbackButtonType.RefreshStatus,
        }),
        addCallbackButton({
          type: DevicesClientCallbackButtonType.AddDevice,
        }),
      ],
      [
        listCallbackButton({
          type: DevicesClientCallbackButtonType.OpenDevicesList,
        }),
      ],
      [
        backCallbackButton({
          type: RootCallbackButtonType.OpenRoot,
        }),
      ],
    ],
  });
}
