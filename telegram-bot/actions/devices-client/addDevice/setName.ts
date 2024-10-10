import { TelegramUserState } from '@prisma/client';
import { Markdown } from '@tg-sensei/bot';
import devicesClient from 'devices-client/client';

import { AddDevicePayload } from 'devices-client/types/device';
import { MessageAction } from 'telegram-bot/types/actions';
import { InlineKeyboard } from 'telegram-bot/types/keyboard';
import { DevicesClientCallbackButtonType } from 'telegram-bot/types/keyboard/devices-client';

import DevicesClient from 'devices-client/utilities/DevicesClient';
import { getAddDevicePayload } from 'devices-client/utilities/payload';
import { backToCallbackButton } from 'telegram-bot/utilities/keyboard';

import { getAddDeviceSetTypeAction } from 'telegram-bot/actions/devices-client/addDevice/setType';
import { callbackDataProvider, userDataProvider } from 'telegram-bot/bot';

const SET_NAME_KEYBOARD: InlineKeyboard = [
  [
    backToCallbackButton('К устройствам', {
      type: DevicesClientCallbackButtonType.OpenStatus,
    }),
  ],
];

callbackDataProvider.handle(
  [DevicesClientCallbackButtonType.AddDevice, DevicesClientCallbackButtonType.AddDeviceBackToSetName],
  async ({ data, user }) => {
    await userDataProvider.setUserData(user.id, {
      ...user.data,
      state: TelegramUserState.AddDeviceSetName,
      addDevicePayload:
        data.type === DevicesClientCallbackButtonType.AddDevice
          ? DevicesClient.defaultDevicePayload
          : user.data.addDevicePayload,
    });

    return getAddDeviceSetNameAction();
  },
);

userDataProvider.handle(TelegramUserState.AddDeviceSetName, async ({ message, user }) => {
  const name = message.text;

  if (!name) {
    return new MessageAction({
      content: {
        type: 'text',
        text: 'Имя устройства должно содержать как минимум 1 символ',
      },
      replyMarkup: SET_NAME_KEYBOARD,
    });
  }

  if (!(await devicesClient.isNameAllowed(name))) {
    return new MessageAction({
      content: {
        type: 'text',
        text: 'Имя устройства должно быть уникальным',
      },
      replyMarkup: SET_NAME_KEYBOARD,
    });
  }

  const newPayload: AddDevicePayload = {
    ...getAddDevicePayload(user.data.addDevicePayload),
    name,
  };

  await userDataProvider.setUserData(user.id, {
    ...user.data,
    state: TelegramUserState.AddDeviceSetType,
    addDevicePayload: newPayload,
  });

  return getAddDeviceSetTypeAction(newPayload);
});

function getAddDeviceSetNameAction(): MessageAction {
  return new MessageAction({
    content: {
      type: 'text',
      text: Markdown.italic('Введите название устройства'),
    },
    replyMarkup: SET_NAME_KEYBOARD,
  });
}
