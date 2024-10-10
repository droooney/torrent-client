import { TelegramUserState } from '@prisma/client';
import devicesClient from 'devices-client/client';

import { EditDevicePayload } from 'devices-client/types/device';
import { ActionsStreamAction, MessageAction } from 'telegram-bot/types/actions';
import { DevicesClientCallbackButtonType } from 'telegram-bot/types/keyboard/devices-client';

import { getEditDevicePayload } from 'devices-client/utilities/payload';
import { getBackToEditDeviceKeyboard } from 'telegram-bot/utilities/actions/devices-client';

import { getEditDeviceAction } from 'telegram-bot/actions/devices-client/devices/device/edit/root';
import { callbackDataProvider, userDataProvider } from 'telegram-bot/bot';

callbackDataProvider.handle(DevicesClientCallbackButtonType.EditDeviceAddress, async ({ data, user }) => {
  const newPayload: EditDevicePayload = {
    deviceId: data.deviceId,
  };

  await userDataProvider.setUserData(user.id, {
    ...user.data,
    state: TelegramUserState.EditDeviceAddress,
    editDevicePayload: newPayload,
  });

  return new MessageAction({
    content: {
      type: 'text',
      text: 'Введите новый адрес',
    },
    replyMarkup: getBackToEditDeviceKeyboard(data.deviceId),
  });
});

userDataProvider.handle(TelegramUserState.EditDeviceAddress, async ({ message, user }) => {
  const editDevicePayload = getEditDevicePayload(user.data.editDevicePayload);

  if (!editDevicePayload) {
    return;
  }

  const { deviceId } = editDevicePayload;
  const address = message.text;

  if (!address) {
    return new MessageAction({
      content: {
        type: 'text',
        text: 'Адрес устройства должно содержать как минимум 1 символ',
      },
      replyMarkup: getBackToEditDeviceKeyboard(deviceId),
    });
  }

  if (!(await devicesClient.isAddressAllowed(address))) {
    return new MessageAction({
      content: {
        type: 'text',
        text: 'Адрес устройства должен быть уникальным',
      },
      replyMarkup: getBackToEditDeviceKeyboard(deviceId),
    });
  }

  await devicesClient.editDevice(deviceId, {
    address,
  });

  return new ActionsStreamAction(async function* () {
    yield new MessageAction({
      content: {
        type: 'text',
        text: 'Адрес изменен',
      },
    });

    yield getEditDeviceAction(deviceId);
  });
});
