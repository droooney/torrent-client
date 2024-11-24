import { TelegramUserState } from '@prisma/client';
import { Markdown, MessageResponse, ResponsesStreamResponse } from '@tg-sensei/bot';
import devicesClient from 'devices-client/client';

import { EditDevicePayload } from 'devices-client/types/device';
import { DevicesClientCallbackButtonType } from 'telegram-bot/types/keyboard/devices-client';

import { isIp } from 'devices-client/utilities/is';
import { getEditDevicePayload } from 'devices-client/utilities/payload';
import { getBackToEditDeviceKeyboard } from 'telegram-bot/utilities/responses/devices-client';
import { isDefined } from 'utilities/is';

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
      content: 'Введите новый ip-адрес. Вбейте "-", чтобы удалить',
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
  let address: string | null = message.text ?? '';

  if (address === '-') {
    address = null;
  }

  if (isDefined(address)) {
    if (!isIp(address)) {
      return ctx.respondWith(
        new MessageResponse({
          content: Markdown.create`Введите валидный ip-адрес (пример: ${Markdown.fixedWidth('192.168.1.120')})`,
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
