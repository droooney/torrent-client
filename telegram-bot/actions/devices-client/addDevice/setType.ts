import { DeviceType, TelegramUserState } from '@prisma/client';
import { Markdown } from '@tg-sensei/bot';

import { AddDevicePayload } from 'devices-client/types/device';
import { MessageAction } from 'telegram-bot/types/actions';
import { DevicesClientCallbackButtonType } from 'telegram-bot/types/keyboard/devices-client';

import { getAddDevicePayload } from 'devices-client/utilities/payload';
import { formatEnteredFields, getDeviceIcon, getDeviceTypeString } from 'telegram-bot/utilities/actions/devices-client';
import { backToCallbackButton, callbackButton } from 'telegram-bot/utilities/keyboard';

import { getAddDeviceSetManufacturerAction } from 'telegram-bot/actions/devices-client/addDevice/setManufacturer';
import { callbackDataProvider, userDataProvider } from 'telegram-bot/bot';

callbackDataProvider.handle(DevicesClientCallbackButtonType.AddDeviceBackToSetType, async ({ user }) => {
  await userDataProvider.setUserData(user.id, {
    ...user.data,
    state: TelegramUserState.AddDeviceSetType,
  });

  return getAddDeviceSetTypeAction(getAddDevicePayload(user.data.addDevicePayload));
});

callbackDataProvider.handle(DevicesClientCallbackButtonType.AddDeviceSetType, async ({ data, user }) => {
  const newPayload: AddDevicePayload = {
    ...getAddDevicePayload(user.data.addDevicePayload),
    type: data.deviceType,
  };

  await userDataProvider.setUserData(user.id, {
    ...user.data,
    state: TelegramUserState.AddDeviceSetManufacturer,
    addDevicePayload: newPayload,
  });

  return getAddDeviceSetManufacturerAction(newPayload);
});

userDataProvider.handle(TelegramUserState.AddDeviceSetType, async ({ user }) => {
  return getAddDeviceSetTypeAction(getAddDevicePayload(user.data.addDevicePayload));
});

export function getAddDeviceSetTypeAction(addDevicePayload: AddDevicePayload): MessageAction {
  return new MessageAction({
    content: {
      type: 'text',
      text: Markdown.create`${formatEnteredFields(addDevicePayload, ['name'])}


${Markdown.italic('Выберите тип устройства')}`,
    },
    replyMarkup: [
      [
        ...Object.values(DeviceType)
          .filter((type) => type !== DeviceType.Other)
          .map((deviceType) =>
            callbackButton(getDeviceIcon(deviceType), getDeviceTypeString(deviceType), {
              type: DevicesClientCallbackButtonType.AddDeviceSetType,
              deviceType,
            }),
          ),
      ],
      [
        backToCallbackButton('К выбору названия', {
          type: DevicesClientCallbackButtonType.AddDeviceBackToSetName,
        }),
      ],
      [
        backToCallbackButton('К устройствам', {
          type: DevicesClientCallbackButtonType.OpenStatus,
        }),
      ],
    ],
  });
}
