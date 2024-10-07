import { TelegramUserState } from '@prisma/client';
import { Markdown } from '@tg-sensei/bot';
import devicesClient from 'devices-client/client';

import { MessageAction } from 'telegram-bot/types/actions';
import { DevicesClientCallbackButtonType } from 'telegram-bot/types/keyboard/devices-client';

import { isMac } from 'devices-client/utilities/is';
import { getAddDevicePayload } from 'devices-client/utilities/payload';
import { callbackButton } from 'telegram-bot/utilities/keyboard';
import { isDefined } from 'utilities/is';

import {
  getAddDeviceSetAddressAction,
  getAddDeviceSetManufacturerAction,
  getAddDeviceSetTypeAction,
} from 'telegram-bot/actions/devices-client';
import { userDataProvider } from 'telegram-bot/bot';

const BACK_TO_STATUS_BUTTON = callbackButton('◀️', 'К устройствам', {
  type: DevicesClientCallbackButtonType.BackToStatus,
});

const BACK_TO_SET_TYPE_BUTTON = callbackButton('◀️', 'К выбору типа', {
  type: DevicesClientCallbackButtonType.AddDeviceBackToSetType,
});

const BACK_TO_SET_MAC_BUTTON = callbackButton('◀️', 'К вводу MAC', {
  type: DevicesClientCallbackButtonType.AddDeviceBackToSetMac,
});

userDataProvider.handle(TelegramUserState.AddDeviceSetName, async ({ message, user }) => {
  const name = message.text;

  if (!name) {
    return new MessageAction({
      content: {
        type: 'text',
        text: 'Имя устройства должно содержать как минимум 1 символ',
      },
      replyMarkup: [[BACK_TO_STATUS_BUTTON]],
    });
  }

  if (!(await devicesClient.isNameAllowed(name))) {
    return new MessageAction({
      content: {
        type: 'text',
        text: 'Имя устройства должно быть уникальным',
      },
      replyMarkup: [[BACK_TO_STATUS_BUTTON]],
    });
  }

  const newPayload = {
    ...getAddDevicePayload(user.data.addDevicePayload),
    name,
  };

  await userDataProvider.setUserData(user.id, {
    ...user.data,
    state: TelegramUserState.AddDeviceSetType,
    addDevicePayload: newPayload,
  });

  return getAddDeviceSetTypeAction(newPayload);
});

userDataProvider.handle(TelegramUserState.AddDeviceSetType, async ({ user }) => {
  return getAddDeviceSetTypeAction(getAddDevicePayload(user.data.addDevicePayload));
});

userDataProvider.handle(TelegramUserState.AddDeviceSetManufacturer, async ({ user }) => {
  return getAddDeviceSetManufacturerAction(getAddDevicePayload(user.data.addDevicePayload));
});

userDataProvider.handle(TelegramUserState.AddDeviceSetMac, async ({ message, user }) => {
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
      replyMarkup: [[BACK_TO_SET_TYPE_BUTTON], [BACK_TO_STATUS_BUTTON]],
    });
  }

  if (isDefined(mac) && !(await devicesClient.isMacAllowed(mac))) {
    return new MessageAction({
      content: {
        type: 'text',
        text: 'MAC-адрес должен быть уникальным',
      },
      replyMarkup: [[BACK_TO_SET_TYPE_BUTTON], [BACK_TO_STATUS_BUTTON]],
    });
  }

  const newPayload = {
    ...getAddDevicePayload(user.data.addDevicePayload),
    mac,
  };

  await userDataProvider.setUserData(user.id, {
    ...user.data,
    state: TelegramUserState.AddDeviceSetAddress,
    addDevicePayload: newPayload,
  });

  return getAddDeviceSetAddressAction(newPayload);
});

userDataProvider.handle(TelegramUserState.AddDeviceSetAddress, async ({ message, user }) => {
  const address = message.text;

  if (!address) {
    return new MessageAction({
      content: {
        type: 'text',
        text: 'Адрес устройства должно содержать как минимум 1 символ',
      },
      replyMarkup: [[BACK_TO_SET_MAC_BUTTON], [BACK_TO_STATUS_BUTTON]],
    });
  }

  if (!(await devicesClient.isAddressAllowed(address))) {
    return new MessageAction({
      content: {
        type: 'text',
        text: 'Адрес устройства должен быть уникальным',
      },
      replyMarkup: [[BACK_TO_SET_MAC_BUTTON], [BACK_TO_STATUS_BUTTON]],
    });
  }

  await userDataProvider.setUserData(user.id, {
    ...user.data,
    state: TelegramUserState.Waiting,
    addDevicePayload: null,
  });

  const device = await devicesClient.addDevice({
    ...getAddDevicePayload(user.data.addDevicePayload),
    address,
  });

  return new MessageAction({
    content: {
      type: 'text',
      text: 'Устройство добавлено!',
    },
    replyMarkup: [
      [
        callbackButton('▶️', 'Подробнее', {
          type: DevicesClientCallbackButtonType.NavigateToDevice,
          deviceId: device.id,
        }),
      ],
    ],
  });
});
