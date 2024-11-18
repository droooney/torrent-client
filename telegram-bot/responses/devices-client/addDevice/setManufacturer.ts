import { DeviceManufacturer, DeviceType, TelegramUserState } from '@prisma/client';
import { Markdown, MessageResponse } from '@tg-sensei/bot';

import { AddDevicePayload } from 'devices-client/types/device';
import { DevicesClientCallbackButtonType } from 'telegram-bot/types/keyboard/devices-client';

import { getAddDevicePayload } from 'devices-client/utilities/payload';
import { backToCallbackButton, callbackButton } from 'telegram-bot/utilities/keyboard';
import { formatDeviceEnteredFields } from 'telegram-bot/utilities/responses/devices-client';

import { callbackDataProvider, messageUserDataProvider } from 'telegram-bot/bot';
import { getAddDeviceSetMacResponse } from 'telegram-bot/responses/devices-client/addDevice/setMac';

callbackDataProvider.handle(DevicesClientCallbackButtonType.AddDeviceSetManufacturer, async (ctx) => {
  const { user } = ctx;

  await user.updateData({
    state: TelegramUserState.AddDeviceSetManufacturer,
  });

  await ctx.respondWith(await getAddDeviceSetManufacturerResponse(getAddDevicePayload(user.data.addDevicePayload)));
});

callbackDataProvider.handle(DevicesClientCallbackButtonType.AddDeviceManufacturer, async (ctx) => {
  const {
    user,
    callbackData: { manufacturer },
  } = ctx;
  const newPayload: AddDevicePayload = {
    ...getAddDevicePayload(user.data.addDevicePayload),
    manufacturer,
  };

  await user.updateData({
    state: TelegramUserState.AddDeviceSetMac,
    addDevicePayload: newPayload,
  });

  await ctx.respondWith(await getAddDeviceSetMacResponse(newPayload));
});

messageUserDataProvider.handle(TelegramUserState.AddDeviceSetManufacturer, async (ctx) => {
  const { user } = ctx;

  await ctx.respondWith(await getAddDeviceSetManufacturerResponse(getAddDevicePayload(user.data.addDevicePayload)));
});

export async function getAddDeviceSetManufacturerResponse(
  addDevicePayload: AddDevicePayload,
): Promise<MessageResponse> {
  return new MessageResponse({
    content: Markdown.create`${formatDeviceEnteredFields(addDevicePayload, ['name', 'type'])}


${Markdown.italic('Выберите производителя устройства')}`,
    replyMarkup: await callbackDataProvider.buildInlineKeyboard([
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
    ]),
  });
}
