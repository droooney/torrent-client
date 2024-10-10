import { TelegramUserState } from '@prisma/client';
import { InlineKeyboard, Markdown } from '@tg-sensei/bot';
import devicesClient from 'devices-client/client';

import { AddDevicePayload } from 'devices-client/types/device';
import { MessageAction } from 'telegram-bot/types/actions';
import { CallbackData } from 'telegram-bot/types/keyboard';
import { DevicesClientCallbackButtonType } from 'telegram-bot/types/keyboard/devices-client';

import { isMac } from 'devices-client/utilities/is';
import { getAddDevicePayload } from 'devices-client/utilities/payload';
import { formatEnteredFields } from 'telegram-bot/utilities/actions/devices-client';
import { backToCallbackButton } from 'telegram-bot/utilities/keyboard';
import { isDefined } from 'utilities/is';

import { getAddDeviceSetAddressAction } from 'telegram-bot/actions/devices-client/addDevice/setAddress';
import { callbackDataProvider, userDataProvider } from 'telegram-bot/bot';

const SET_MAC_KEYBOARD: InlineKeyboard<CallbackData> = [
  [
    backToCallbackButton('К выбору производителя', {
      type: DevicesClientCallbackButtonType.AddDeviceBackToSetManufacturer,
    }),
  ],
  [
    backToCallbackButton('К устройствам', {
      type: DevicesClientCallbackButtonType.OpenStatus,
    }),
  ],
];

callbackDataProvider.handle(DevicesClientCallbackButtonType.AddDeviceBackToSetMac, async ({ user }) => {
  await userDataProvider.setUserData(user.id, {
    ...user.data,
    state: TelegramUserState.AddDeviceSetMac,
  });

  return getAddDeviceSetMacAction(getAddDevicePayload(user.data.addDevicePayload));
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
      replyMarkup: SET_MAC_KEYBOARD,
    });
  }

  if (isDefined(mac) && !(await devicesClient.isMacAllowed(mac))) {
    return new MessageAction({
      content: {
        type: 'text',
        text: 'MAC-адрес должен быть уникальным',
      },
      replyMarkup: SET_MAC_KEYBOARD,
    });
  }

  const newPayload: AddDevicePayload = {
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

export function getAddDeviceSetMacAction(addDevicePayload: AddDevicePayload): MessageAction {
  return new MessageAction({
    content: {
      type: 'text',
      text: Markdown.create`${formatEnteredFields(addDevicePayload, ['name', 'type', 'manufacturer'])}


${Markdown.italic('Введите MAC устройства. Вбейте "-", чтобы пропустить')}`,
    },
    replyMarkup: SET_MAC_KEYBOARD,
  });
}
