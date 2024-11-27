import { TelegramUserState } from '@prisma/client';
import { InlineKeyboard, Markdown, MessageResponse } from '@tg-sensei/bot';
import devicesClient from 'devices-client/client';

import { AddDevicePayload } from 'devices-client/types/device';
import { DevicesClientCallbackButtonType } from 'telegram-bot/types/keyboard/devices-client';

import { isMac } from 'devices-client/utilities/is';
import { getAddDevicePayload } from 'devices-client/utilities/payload';
import { backToCallbackButton } from 'telegram-bot/utilities/keyboard';
import { formatDeviceEnteredFields } from 'telegram-bot/utilities/responses/devices-client';
import { isDefined } from 'utilities/is';

import { callbackDataProvider, messageUserDataProvider } from 'telegram-bot/bot';
import { getAddDeviceSetAddressResponse } from 'telegram-bot/responses/devices-client/addDevice/setAddress';
import { getAddDeviceSetMatterPairingCodeResponse } from 'telegram-bot/responses/devices-client/addDevice/setMatterPairingCode';

callbackDataProvider.handle(DevicesClientCallbackButtonType.AddDeviceSetMac, async (ctx) => {
  const { user } = ctx;

  await user.updateData({
    state: TelegramUserState.AddDeviceSetMac,
  });

  await ctx.respondWith(await getAddDeviceSetMacResponse(getAddDevicePayload(user.data.addDevicePayload)));
});

messageUserDataProvider.handle(TelegramUserState.AddDeviceSetMac, async (ctx) => {
  const { message, user } = ctx;
  let mac: string | null = message.text?.toUpperCase() ?? '';

  if (mac === '-') {
    mac = null;
  }

  if (isDefined(mac)) {
    if (!isMac(mac)) {
      return ctx.respondWith(
        new MessageResponse({
          content: Markdown.create`Введите валидный MAC-адрес (пример: ${Markdown.fixedWidth('12:23:56:9f:aa:bb')})`,
          replyMarkup: await getSetMacKeyboard(),
        }),
      );
    }

    if (!(await devicesClient.isMacAllowed(mac))) {
      return ctx.respondWith(
        new MessageResponse({
          content: 'MAC-адрес должен быть уникальным',
          replyMarkup: await getSetMacKeyboard(),
        }),
      );
    }
  }

  const newPayload: AddDevicePayload = {
    ...getAddDevicePayload(user.data.addDevicePayload),
    ...(await devicesClient.getDeviceAddressAndMac({
      address: null,
      mac,
    })),
  };

  await user.updateData({
    state: newPayload.address
      ? TelegramUserState.AddDeviceEnterMatterPairingCode
      : TelegramUserState.AddDeviceSetAddress,
    addDevicePayload: newPayload,
  });

  await ctx.respondWith(
    newPayload.address
      ? await getAddDeviceSetMatterPairingCodeResponse(newPayload)
      : await getAddDeviceSetAddressResponse(newPayload),
  );
});

export async function getAddDeviceSetMacResponse(addDevicePayload: AddDevicePayload): Promise<MessageResponse> {
  return new MessageResponse({
    content: Markdown.create`${formatDeviceEnteredFields(addDevicePayload, ['name', 'type', 'manufacturer'])}


${Markdown.italic('Введите MAC устройства. Вбейте "-", чтобы пропустить')}`,
    replyMarkup: await getSetMacKeyboard(),
  });
}

async function getSetMacKeyboard(): Promise<InlineKeyboard> {
  return callbackDataProvider.buildInlineKeyboard([
    [
      backToCallbackButton('К выбору производителя', {
        type: DevicesClientCallbackButtonType.AddDeviceSetManufacturer,
      }),
    ],
    [
      backToCallbackButton('К устройствам', {
        type: DevicesClientCallbackButtonType.OpenStatus,
      }),
    ],
  ]);
}
