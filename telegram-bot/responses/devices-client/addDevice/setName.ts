import { TelegramUserState } from '@prisma/client';
import { InlineKeyboard, Markdown, MessageResponse } from '@tg-sensei/bot';
import devicesClient from 'devices-client/client';

import { AddDevicePayload } from 'devices-client/types/device';
import { DevicesClientCallbackButtonType } from 'telegram-bot/types/keyboard/devices-client';

import DevicesClient from 'devices-client/utilities/DevicesClient';
import { getAddDevicePayload } from 'devices-client/utilities/payload';
import { backToCallbackButton } from 'telegram-bot/utilities/keyboard';

import { callbackDataProvider, messageUserDataProvider } from 'telegram-bot/bot';
import { getAddDeviceSetTypeResponse } from 'telegram-bot/responses/devices-client/addDevice/setType';

callbackDataProvider.handle(DevicesClientCallbackButtonType.AddDeviceSetName, async (ctx) => {
  const {
    user,
    callbackData: { isBack },
  } = ctx;

  await user.updateData({
    state: TelegramUserState.AddDeviceSetName,
    addDevicePayload: isBack ? user.data.addDevicePayload : DevicesClient.defaultDevicePayload,
  });

  await ctx.respondWith(
    new MessageResponse({
      content: Markdown.italic('Введите название устройства'),
      replyMarkup: await getSetNameKeyboard(),
    }),
  );
});

messageUserDataProvider.handle(TelegramUserState.AddDeviceSetName, async (ctx) => {
  const {
    message: { text: name },
    user,
  } = ctx;

  if (!name) {
    return ctx.respondWith(
      new MessageResponse({
        content: 'Название устройства должно содержать как минимум 1 символ',
        replyMarkup: await getSetNameKeyboard(),
      }),
    );
  }

  if (!(await devicesClient.isNameAllowed(name))) {
    return ctx.respondWith(
      new MessageResponse({
        content: 'Название устройства должно быть уникальным',
        replyMarkup: await getSetNameKeyboard(),
      }),
    );
  }

  const newPayload: AddDevicePayload = {
    ...getAddDevicePayload(user.data.addDevicePayload),
    name,
  };

  await user.updateData({
    state: TelegramUserState.AddDeviceSetType,
    addDevicePayload: newPayload,
  });

  await ctx.respondWith(await getAddDeviceSetTypeResponse(newPayload));
});

async function getSetNameKeyboard(): Promise<InlineKeyboard> {
  return callbackDataProvider.buildInlineKeyboard([
    [
      backToCallbackButton('К устройствам', {
        type: DevicesClientCallbackButtonType.OpenStatus,
      }),
    ],
  ]);
}
