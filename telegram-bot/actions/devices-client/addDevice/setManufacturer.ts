import { DeviceManufacturer, DeviceType, TelegramUserState } from '@prisma/client';
import { Markdown } from '@tg-sensei/bot';

import { AddDevicePayload } from 'devices-client/types/device';
import { MessageAction } from 'telegram-bot/types/actions';
import { DevicesClientCallbackButtonType } from 'telegram-bot/types/keyboard/devices-client';

import { getAddDevicePayload } from 'devices-client/utilities/payload';
import { formatDeviceEnteredFields } from 'telegram-bot/utilities/actions/devices-client';
import { backToCallbackButton, callbackButton } from 'telegram-bot/utilities/keyboard';

import { getAddDeviceSetMacAction } from 'telegram-bot/actions/devices-client/addDevice/setMac';
import { callbackDataProvider, userDataProvider } from 'telegram-bot/bot';

callbackDataProvider.handle(DevicesClientCallbackButtonType.AddDeviceSetManufacturer, async ({ user }) => {
  await userDataProvider.setUserData(user.id, {
    ...user.data,
    state: TelegramUserState.AddDeviceSetManufacturer,
  });

  return getAddDeviceSetManufacturerAction(getAddDevicePayload(user.data.addDevicePayload));
});

callbackDataProvider.handle(DevicesClientCallbackButtonType.AddDeviceManufacturer, async ({ data, user }) => {
  const newPayload: AddDevicePayload = {
    ...getAddDevicePayload(user.data.addDevicePayload),
    manufacturer: data.manufacturer,
  };

  await userDataProvider.setUserData(user.id, {
    ...user.data,
    state: TelegramUserState.AddDeviceSetMac,
    addDevicePayload: newPayload,
  });

  return getAddDeviceSetMacAction(newPayload);
});

userDataProvider.handle(TelegramUserState.AddDeviceSetManufacturer, async ({ user }) => {
  return getAddDeviceSetManufacturerAction(getAddDevicePayload(user.data.addDevicePayload));
});

export function getAddDeviceSetManufacturerAction(addDevicePayload: AddDevicePayload): MessageAction {
  return new MessageAction({
    content: {
      type: 'text',
      text: Markdown.create`${formatDeviceEnteredFields(addDevicePayload, ['name', 'type'])}


${Markdown.italic('Выберите производителя устройства')}`,
    },
    replyMarkup: [
      [
        ...Object.values(DeviceManufacturer).map((manufacturer) =>
          callbackButton('', manufacturer === DeviceType.Other ? 'Другой' : manufacturer, {
            type: DevicesClientCallbackButtonType.AddDeviceManufacturer,
            manufacturer,
          }),
        ),
      ],
      [
        backToCallbackButton('К выбору типа', {
          type: DevicesClientCallbackButtonType.AddDeviceSetType,
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
