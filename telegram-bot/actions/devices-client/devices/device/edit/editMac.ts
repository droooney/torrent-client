import { TelegramUserState } from '@prisma/client';
import { Markdown } from '@tg-sensei/bot';
import devicesClient from 'devices-client/client';

import { EditDevicePayload } from 'devices-client/types/device';
import { ActionsStreamAction, MessageAction } from 'telegram-bot/types/actions';
import { DevicesClientCallbackButtonType } from 'telegram-bot/types/keyboard/devices-client';

import { isMac } from 'devices-client/utilities/is';
import { getEditDevicePayload } from 'devices-client/utilities/payload';
import { getBackToEditDeviceKeyboard } from 'telegram-bot/utilities/actions/devices-client';
import { isDefined } from 'utilities/is';

import { getEditDeviceAction } from 'telegram-bot/actions/devices-client/devices/device/edit/root';
import { callbackDataProvider, userDataProvider } from 'telegram-bot/bot';

callbackDataProvider.handle(DevicesClientCallbackButtonType.EditDeviceMac, async ({ data, user }) => {
  const newPayload: EditDevicePayload = {
    deviceId: data.deviceId,
  };

  await userDataProvider.setUserData(user.id, {
    ...user.data,
    state: TelegramUserState.EditDeviceMac,
    editDevicePayload: newPayload,
  });

  return new MessageAction({
    content: {
      type: 'text',
      text: 'Введите новый MAC. Вбейте "-", чтобы удалить',
    },
    replyMarkup: getBackToEditDeviceKeyboard(data.deviceId),
  });
});

userDataProvider.handle(TelegramUserState.EditDeviceMac, async ({ message, user }) => {
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
    return new MessageAction({
      content: {
        type: 'text',
        text: Markdown.create`Введите валидный MAC-адрес (пример: ${Markdown.fixedWidth('12:23:56:9f:aa:bb')})`,
      },
      replyMarkup: getBackToEditDeviceKeyboard(deviceId),
    });
  }

  if (isDefined(mac) && !(await devicesClient.isMacAllowed(mac))) {
    return new MessageAction({
      content: {
        type: 'text',
        text: 'MAC-адрес должен быть уникальным',
      },
      replyMarkup: getBackToEditDeviceKeyboard(deviceId),
    });
  }

  await devicesClient.editDevice(deviceId, {
    mac,
  });

  return new ActionsStreamAction(async function* () {
    yield new MessageAction({
      content: {
        type: 'text',
        text: isDefined(mac) ? 'MAC изменен' : 'MAC удален',
      },
    });

    yield getEditDeviceAction(deviceId);
  });
});
