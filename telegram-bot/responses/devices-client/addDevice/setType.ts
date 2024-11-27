import { DeviceType, TelegramUserState } from '@prisma/client';
import { Markdown, MessageResponse } from '@tg-sensei/bot';
import chunk from 'lodash/chunk';

import { AddDevicePayload } from 'devices-client/types/device';
import { DevicesClientCallbackButtonType } from 'telegram-bot/types/keyboard/devices-client';

import { getAddDevicePayload } from 'devices-client/utilities/payload';
import { backToCallbackButton, callbackButton } from 'telegram-bot/utilities/keyboard';
import {
  formatDeviceEnteredFields,
  getDeviceIcon,
  getDeviceTypeString,
} from 'telegram-bot/utilities/responses/devices-client';

import { callbackDataProvider, messageUserDataProvider } from 'telegram-bot/bot';
import { getAddDeviceSetManufacturerResponse } from 'telegram-bot/responses/devices-client/addDevice/setManufacturer';

callbackDataProvider.handle(DevicesClientCallbackButtonType.AddDeviceSetType, async (ctx) => {
  const { user } = ctx;

  await user.updateData({
    state: TelegramUserState.AddDeviceSetType,
  });

  await ctx.respondWith(await getAddDeviceSetTypeResponse(getAddDevicePayload(user.data.addDevicePayload)));
});

callbackDataProvider.handle(DevicesClientCallbackButtonType.AddDeviceType, async (ctx) => {
  const {
    user,
    callbackData: { deviceType },
  } = ctx;
  const newPayload: AddDevicePayload = {
    ...getAddDevicePayload(user.data.addDevicePayload),
    type: deviceType,
  };

  await user.updateData({
    state: TelegramUserState.AddDeviceSetManufacturer,
    addDevicePayload: newPayload,
  });

  await ctx.respondWith(await getAddDeviceSetManufacturerResponse(newPayload));
});

messageUserDataProvider.handle(TelegramUserState.AddDeviceSetType, async (ctx) => {
  const { user } = ctx;

  await ctx.respondWith(await getAddDeviceSetTypeResponse(getAddDevicePayload(user.data.addDevicePayload)));
});

export async function getAddDeviceSetTypeResponse(addDevicePayload: AddDevicePayload): Promise<MessageResponse> {
  return new MessageResponse({
    content: Markdown.create`${formatDeviceEnteredFields(addDevicePayload, ['name'])}


${Markdown.italic('Выберите тип устройства')}`,
    replyMarkup: await callbackDataProvider.buildInlineKeyboard([
      ...chunk(
        Object.values(DeviceType)
          .filter((type) => type !== DeviceType.Unknown)
          .map((deviceType) =>
            callbackButton(getDeviceIcon(deviceType), getDeviceTypeString(deviceType), {
              type: DevicesClientCallbackButtonType.AddDeviceType,
              deviceType,
            }),
          ),
        3,
      ),
      [
        backToCallbackButton('К выбору названия', {
          type: DevicesClientCallbackButtonType.AddDeviceSetName,
          isBack: true,
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
