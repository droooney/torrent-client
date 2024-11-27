import { DeviceManufacturer, DeviceType } from '@prisma/client';
import { MessageResponse } from '@tg-sensei/bot';
import devicesClient from 'devices-client/client';

import { DevicesClientCallbackButtonType } from 'telegram-bot/types/keyboard/devices-client';

import { callbackButton } from 'telegram-bot/utilities/keyboard';
import MessageWithNotificationResponse from 'telegram-bot/utilities/responses/MessageWithNotificationResponse';
import { getBackToEditDeviceKeyboardButtons } from 'telegram-bot/utilities/responses/devices-client';

import { callbackDataProvider } from 'telegram-bot/bot';
import { getEditDeviceResponse } from 'telegram-bot/responses/devices-client/devices/device/edit/root';

callbackDataProvider.handle(DevicesClientCallbackButtonType.EditDeviceManufacturer, async (ctx) => {
  const { deviceId } = ctx.callbackData;

  await ctx.respondWith(
    new MessageResponse({
      content: 'Выберите нового производителя',
      replyMarkup: await callbackDataProvider.buildInlineKeyboard([
        [
          ...Object.values(DeviceManufacturer).map((manufacturer) =>
            callbackButton('', manufacturer === DeviceManufacturer.Other ? 'Другой' : manufacturer, {
              type: DevicesClientCallbackButtonType.EditDeviceSetManufacturer,
              deviceId,
              manufacturer,
            }),
          ),
        ],
        ...getBackToEditDeviceKeyboardButtons(deviceId),
      ]),
    }),
  );
});

callbackDataProvider.handle(DevicesClientCallbackButtonType.EditDeviceSetManufacturer, async (ctx) => {
  const { deviceId, manufacturer } = ctx.callbackData;

  await devicesClient.editDevice(deviceId, {
    manufacturer,
  });

  await ctx.respondWith(
    new MessageWithNotificationResponse({
      text: 'Производитель изменен',
      updateResponse: await getEditDeviceResponse(deviceId),
    }),
  );
});
