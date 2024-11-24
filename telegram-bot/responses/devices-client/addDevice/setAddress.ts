import { TelegramUserState } from '@prisma/client';
import { InlineKeyboard, Markdown, MessageResponse } from '@tg-sensei/bot';
import devicesClient from 'devices-client/client';

import { AddDevicePayload } from 'devices-client/types/device';
import { DevicesClientCallbackButtonType } from 'telegram-bot/types/keyboard/devices-client';

import { getAddDevicePayload } from 'devices-client/utilities/payload';
import { backToCallbackButton } from 'telegram-bot/utilities/keyboard';
import { formatDeviceEnteredFields } from 'telegram-bot/utilities/responses/devices-client';
import { isDefined } from 'utilities/is';

import { callbackDataProvider, messageUserDataProvider } from 'telegram-bot/bot';
import { getAddDeviceSetMatterPairingCodeResponse } from 'telegram-bot/responses/devices-client/addDevice/setMatterPairingCode';

callbackDataProvider.handle(DevicesClientCallbackButtonType.AddDeviceSetAddress, async (ctx) => {
  const { user } = ctx;

  await user.updateData({
    state: TelegramUserState.AddDeviceSetAddress,
  });

  await ctx.respondWith(await getAddDeviceSetAddressResponse(getAddDevicePayload(user.data.addDevicePayload)));
});

messageUserDataProvider.handle(TelegramUserState.AddDeviceSetAddress, async (ctx) => {
  const { message, user } = ctx;
  let address: string | null = message.text ?? '';

  if (address === '-') {
    address = null;
  }

  if (isDefined(address)) {
    if (!address) {
      return ctx.respondWith(
        new MessageResponse({
          content: 'Адрес устройства должно содержать как минимум 1 символ',
          replyMarkup: await getSetAddressKeyboard(),
        }),
      );
    }

    if (!(await devicesClient.isAddressAllowed(address))) {
      return ctx.respondWith(
        new MessageResponse({
          content: 'Адрес устройства должен быть уникальным',
          replyMarkup: await getSetAddressKeyboard(),
        }),
      );
    }
  }

  const newPayload: AddDevicePayload = {
    ...getAddDevicePayload(user.data.addDevicePayload),
    address,
  };

  await user.updateData({
    state: TelegramUserState.AddDeviceEnterMatterPairingCode,
    addDevicePayload: newPayload,
  });

  await ctx.respondWith(await getAddDeviceSetMatterPairingCodeResponse(newPayload));
});

export async function getAddDeviceSetAddressResponse(addDevicePayload: AddDevicePayload): Promise<MessageResponse> {
  return new MessageResponse({
    content: Markdown.create`${formatDeviceEnteredFields(addDevicePayload, ['name', 'type', 'manufacturer', 'mac'])}


${Markdown.italic('Введите адрес устройства. Вбейте "-", чтобы пропустить')}`,
    replyMarkup: await getSetAddressKeyboard(),
  });
}

async function getSetAddressKeyboard(): Promise<InlineKeyboard> {
  return callbackDataProvider.buildInlineKeyboard([
    [
      backToCallbackButton('К вводу MAC', {
        type: DevicesClientCallbackButtonType.AddDeviceSetMac,
      }),
    ],
    [
      backToCallbackButton('К устройствам', {
        type: DevicesClientCallbackButtonType.OpenStatus,
      }),
    ],
  ]);
}
