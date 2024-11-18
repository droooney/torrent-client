import { TelegramUserState } from '@prisma/client';
import { MessageResponse, ResponsesStreamResponse } from '@tg-sensei/bot';
import devicesClient from 'devices-client/client';

import { EditDevicePayload } from 'devices-client/types/device';
import { DevicesClientCallbackButtonType } from 'telegram-bot/types/keyboard/devices-client';

import { getEditDevicePayload } from 'devices-client/utilities/payload';
import { getBackToEditDeviceKeyboard } from 'telegram-bot/utilities/responses/devices-client';

import { callbackDataProvider, messageUserDataProvider } from 'telegram-bot/bot';
import { getEditDeviceResponse } from 'telegram-bot/responses/devices-client/devices/device/edit/root';

callbackDataProvider.handle(DevicesClientCallbackButtonType.EditDeviceName, async (ctx) => {
  const {
    user,
    callbackData: { deviceId },
  } = ctx;
  const newPayload: EditDevicePayload = {
    deviceId,
  };

  await user.updateData({
    state: TelegramUserState.EditDeviceName,
    editDevicePayload: newPayload,
  });

  await ctx.respondWith(
    new MessageResponse({
      content: 'Введите новое название',
      replyMarkup: await getBackToEditDeviceKeyboard(deviceId),
    }),
  );
});

messageUserDataProvider.handle(TelegramUserState.EditDeviceName, async (ctx) => {
  const {
    message: { text: name },
    user,
  } = ctx;
  const editDevicePayload = getEditDevicePayload(user.data.editDevicePayload);

  if (!editDevicePayload) {
    return;
  }

  const { deviceId } = editDevicePayload;

  if (!name) {
    return ctx.respondWith(
      new MessageResponse({
        content: 'Название устройства должно содержать как минимум 1 символ',
        replyMarkup: await getBackToEditDeviceKeyboard(deviceId),
      }),
    );
  }

  if (!(await devicesClient.isNameAllowed(name))) {
    return ctx.respondWith(
      new MessageResponse({
        content: 'Название устройства должно быть уникальным',
        replyMarkup: await getBackToEditDeviceKeyboard(deviceId),
      }),
    );
  }

  await devicesClient.editDevice(deviceId, {
    name,
  });

  await user.updateData({
    state: TelegramUserState.Waiting,
    editDevicePayload: null,
  });

  await ctx.respondWith(
    new ResponsesStreamResponse(async function* () {
      yield new MessageResponse({
        content: 'Название изменено',
      });

      yield getEditDeviceResponse(deviceId);
    }),
  );
});
