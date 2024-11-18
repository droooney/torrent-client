import { TelegramUserState } from '@prisma/client';
import { MessageResponse, ResponsesStreamResponse } from '@tg-sensei/bot';
import devicesClient from 'devices-client/client';

import { EditDevicePayload } from 'devices-client/types/device';
import { DevicesClientCallbackButtonType } from 'telegram-bot/types/keyboard/devices-client';

import { getEditDevicePayload } from 'devices-client/utilities/payload';
import { getBackToEditDeviceKeyboard } from 'telegram-bot/utilities/responses/devices-client';

import { callbackDataProvider, messageUserDataProvider } from 'telegram-bot/bot';
import { getEditDeviceResponse } from 'telegram-bot/responses/devices-client/devices/device/edit/root';

callbackDataProvider.handle(DevicesClientCallbackButtonType.EditDeviceAddress, async (ctx) => {
  const {
    user,
    callbackData: { deviceId },
  } = ctx;
  const newPayload: EditDevicePayload = {
    deviceId,
  };

  await user.updateData({
    state: TelegramUserState.EditDeviceAddress,
    editDevicePayload: newPayload,
  });

  await ctx.respondWith(
    new MessageResponse({
      content: 'Введите новый адрес',
      replyMarkup: await getBackToEditDeviceKeyboard(deviceId),
    }),
  );
});

messageUserDataProvider.handle(TelegramUserState.EditDeviceAddress, async (ctx) => {
  const { message, user } = ctx;
  const editDevicePayload = getEditDevicePayload(user.data.editDevicePayload);

  if (!editDevicePayload) {
    return;
  }

  const { deviceId } = editDevicePayload;
  const address = message.text;

  if (!address) {
    return ctx.respondWith(
      new MessageResponse({
        content: 'Адрес устройства должно содержать как минимум 1 символ',
        replyMarkup: await getBackToEditDeviceKeyboard(deviceId),
      }),
    );
  }

  if (!(await devicesClient.isAddressAllowed(address))) {
    return ctx.respondWith(
      new MessageResponse({
        content: 'Адрес устройства должен быть уникальным',
        replyMarkup: await getBackToEditDeviceKeyboard(deviceId),
      }),
    );
  }

  await devicesClient.editDevice(deviceId, {
    address,
  });

  await user.updateData({
    state: TelegramUserState.Waiting,
    editDevicePayload: null,
  });

  await ctx.respondWith(
    new ResponsesStreamResponse(async function* () {
      yield new MessageResponse({
        content: 'Адрес изменен',
      });

      yield getEditDeviceResponse(deviceId);
    }),
  );
});
