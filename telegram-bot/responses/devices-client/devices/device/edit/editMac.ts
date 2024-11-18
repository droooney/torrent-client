import { TelegramUserState } from '@prisma/client';
import { Markdown, MessageResponse, ResponsesStreamResponse } from '@tg-sensei/bot';
import devicesClient from 'devices-client/client';

import { EditDevicePayload } from 'devices-client/types/device';
import { DevicesClientCallbackButtonType } from 'telegram-bot/types/keyboard/devices-client';

import { isMac } from 'devices-client/utilities/is';
import { getEditDevicePayload } from 'devices-client/utilities/payload';
import { getBackToEditDeviceKeyboard } from 'telegram-bot/utilities/responses/devices-client';
import { isDefined } from 'utilities/is';

import { callbackDataProvider, messageUserDataProvider } from 'telegram-bot/bot';
import { getEditDeviceResponse } from 'telegram-bot/responses/devices-client/devices/device/edit/root';

callbackDataProvider.handle(DevicesClientCallbackButtonType.EditDeviceMac, async (ctx) => {
  const {
    user,
    callbackData: { deviceId },
  } = ctx;
  const newPayload: EditDevicePayload = {
    deviceId,
  };

  await user.updateData({
    state: TelegramUserState.EditDeviceMac,
    editDevicePayload: newPayload,
  });

  await ctx.respondWith(
    new MessageResponse({
      content: 'Введите новый MAC. Вбейте "-", чтобы удалить',
      replyMarkup: await getBackToEditDeviceKeyboard(deviceId),
    }),
  );
});

messageUserDataProvider.handle(TelegramUserState.EditDeviceMac, async (ctx) => {
  const { message, user } = ctx;
  const editDevicePayload = getEditDevicePayload(user.data.editDevicePayload);

  if (!editDevicePayload) {
    return;
  }

  const { deviceId } = editDevicePayload;
  let mac: string | null = message.text?.toUpperCase() ?? '';

  if (mac === '-') {
    mac = null;
  }

  if (isDefined(mac) && !isMac(mac)) {
    return ctx.respondWith(
      new MessageResponse({
        content: Markdown.create`Введите валидный MAC-адрес (пример: ${Markdown.fixedWidth('12:23:56:9f:aa:bb')})`,
        replyMarkup: await getBackToEditDeviceKeyboard(deviceId),
      }),
    );
  }

  if (isDefined(mac) && !(await devicesClient.isMacAllowed(mac))) {
    return ctx.respondWith(
      new MessageResponse({
        content: 'MAC-адрес должен быть уникальным',
        replyMarkup: await getBackToEditDeviceKeyboard(deviceId),
      }),
    );
  }

  await devicesClient.editDevice(deviceId, {
    mac,
  });

  await user.updateData({
    state: TelegramUserState.Waiting,
    editDevicePayload: null,
  });

  await ctx.respondWith(
    new ResponsesStreamResponse(async function* () {
      yield new MessageResponse({
        content: isDefined(mac) ? 'MAC изменен' : 'MAC удален',
      });

      yield getEditDeviceResponse(deviceId);
    }),
  );
});
