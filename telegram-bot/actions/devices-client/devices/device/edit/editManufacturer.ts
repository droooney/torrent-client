import { DeviceManufacturer, DeviceType } from '@prisma/client';
import devicesClient from 'devices-client/client';

import { MessageAction } from 'telegram-bot/types/actions';
import { DevicesClientCallbackButtonType } from 'telegram-bot/types/keyboard/devices-client';

import MessageWithNotificationAction from 'telegram-bot/utilities/actions/MessageWithNotificationAction';
import { getBackToEditDeviceKeyboard } from 'telegram-bot/utilities/actions/devices-client';
import { callbackButton } from 'telegram-bot/utilities/keyboard';

import { getEditDeviceAction } from 'telegram-bot/actions/devices-client/devices/device/edit/root';
import { callbackDataProvider } from 'telegram-bot/bot';

callbackDataProvider.handle(DevicesClientCallbackButtonType.EditDeviceManufacturer, async ({ data }) => {
  return new MessageAction({
    content: {
      type: 'text',
      text: 'Выберите нового производителя',
    },
    replyMarkup: [
      [
        ...Object.values(DeviceManufacturer).map((manufacturer) =>
          callbackButton('', manufacturer === DeviceType.Other ? 'Другой' : manufacturer, {
            type: DevicesClientCallbackButtonType.EditDeviceSetManufacturer,
            deviceId: data.deviceId,
            manufacturer,
          }),
        ),
      ],
      ...getBackToEditDeviceKeyboard(data.deviceId),
    ],
  });
});

callbackDataProvider.handle(DevicesClientCallbackButtonType.EditDeviceSetManufacturer, async ({ data }) => {
  await devicesClient.editDevice(data.deviceId, {
    manufacturer: data.manufacturer,
  });

  return new MessageWithNotificationAction({
    text: 'Производитель изменен',
    updateAction: await getEditDeviceAction(data.deviceId),
  });
});
