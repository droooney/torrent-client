import { Markdown } from '@tg-sensei/bot';
import devicesClient from 'devices-client/client';

import { MessageAction } from 'telegram-bot/types/actions';
import { DevicesClientCallbackButtonType } from 'telegram-bot/types/keyboard/devices-client';

import { formatDeviceFields } from 'telegram-bot/utilities/actions/devices-client';
import { backToCallbackButton, callbackButton } from 'telegram-bot/utilities/keyboard';

import { callbackDataProvider } from 'telegram-bot/bot';

callbackDataProvider.handle(DevicesClientCallbackButtonType.EditDevice, async ({ data }) => {
  return getEditDeviceAction(data.deviceId);
});

export async function getEditDeviceAction(deviceId: number): Promise<MessageAction> {
  const device = await devicesClient.getDevice(deviceId);

  return new MessageAction({
    content: {
      type: 'text',
      text: Markdown.create`${Markdown.bold('Редактирование устройства')}

${formatDeviceFields(device, ['name', 'type', 'manufacturer', 'mac', 'address'])}`,
    },
    replyMarkup: [
      [
        callbackButton('🅰️️', 'Изменить название', {
          type: DevicesClientCallbackButtonType.EditDeviceName,
          deviceId,
        }),
        callbackButton('🏭️', 'Изменить производителя', {
          type: DevicesClientCallbackButtonType.EditDeviceManufacturer,
          deviceId,
        }),
      ],
      [
        callbackButton('🔠️', 'Изменить MAC', {
          type: DevicesClientCallbackButtonType.EditDeviceMac,
          deviceId,
        }),
        callbackButton('🌐️', 'Изменить адрес', {
          type: DevicesClientCallbackButtonType.EditDeviceAddress,
          deviceId,
        }),
      ],
      [
        backToCallbackButton('К устройству', {
          type: DevicesClientCallbackButtonType.OpenDevice,
          deviceId,
        }),
        backToCallbackButton('К списку', {
          type: DevicesClientCallbackButtonType.OpenDevicesList,
        }),
      ],
    ],
  });
}
