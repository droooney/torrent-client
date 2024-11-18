import { Markdown, MessageResponse } from '@tg-sensei/bot';
import devicesClient from 'devices-client/client';

import { DevicesClientCallbackButtonType } from 'telegram-bot/types/keyboard/devices-client';

import { backToCallbackButton, callbackButton } from 'telegram-bot/utilities/keyboard';
import { formatDeviceFields } from 'telegram-bot/utilities/responses/devices-client';

import { callbackDataProvider } from 'telegram-bot/bot';

callbackDataProvider.handle(DevicesClientCallbackButtonType.EditDevice, async (ctx) => {
  const { deviceId } = ctx.callbackData;

  await ctx.respondWith(await getEditDeviceResponse(deviceId));
});

export async function getEditDeviceResponse(deviceId: number): Promise<MessageResponse> {
  const device = await devicesClient.getDevice(deviceId);

  return new MessageResponse({
    content: Markdown.create`${Markdown.bold('Редактирование устройства')}

${formatDeviceFields(device, ['name', 'type', 'manufacturer', 'mac', 'address'])}`,
    replyMarkup: await callbackDataProvider.buildInlineKeyboard([
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
    ]),
  });
}
