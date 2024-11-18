import { TelegramUserState } from '@prisma/client';
import { InlineKeyboard, Markdown, MessageResponse, ResponsesStreamResponse } from '@tg-sensei/bot';
import devicesClient from 'devices-client/client';

import { SECOND } from 'constants/date';

import { AddDevicePayload } from 'devices-client/types/device';
import { DevicesClientCallbackButtonType } from 'telegram-bot/types/keyboard/devices-client';

import { getAddDevicePayload } from 'devices-client/utilities/payload';
import { backToCallbackButton } from 'telegram-bot/utilities/keyboard';
import { formatDeviceEnteredFields } from 'telegram-bot/utilities/responses/devices-client';

import { callbackDataProvider, messageUserDataProvider } from 'telegram-bot/bot';
import { getDeviceResponse } from 'telegram-bot/responses/devices-client/devices/device/status';

messageUserDataProvider.handle(TelegramUserState.AddDeviceSetAddress, async (ctx) => {
  const {
    message: { text: address },
    user,
  } = ctx;

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

  const device = await devicesClient.addDevice({
    ...getAddDevicePayload(user.data.addDevicePayload),
    address,
  });

  await user.updateData({
    state: TelegramUserState.Waiting,
    addDevicePayload: null,
  });

  await ctx.respondWith(
    new ResponsesStreamResponse(async function* () {
      yield new MessageResponse({
        content: 'Устройство добавлено!',
      });

      yield getDeviceResponse(device.id, {
        timeout: SECOND,
      });
    }),
  );
});

export async function getAddDeviceSetAddressResponse(addDevicePayload: AddDevicePayload): Promise<MessageResponse> {
  return new MessageResponse({
    content: Markdown.create`${formatDeviceEnteredFields(addDevicePayload, ['name', 'type', 'manufacturer', 'mac'])}


${Markdown.italic('Введите адрес устройства')}`,
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
