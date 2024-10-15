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

callbackDataProvider.handle(DevicesClientCallbackButtonType.OpenStatus, async ({ data }) => {
  const action = getStatusAction();

  return data.isRefresh ? new RefreshDataAction(await getStatusAction()) : action;
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
          type: DevicesClientCallbackButtonType.OpenStatus,
          isRefresh: true,
        }),
        addCallbackButton({
          type: DevicesClientCallbackButtonType.AddDeviceSetName,
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
