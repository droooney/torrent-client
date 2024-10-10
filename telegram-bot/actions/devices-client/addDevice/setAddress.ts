import { TelegramUserState } from '@prisma/client';
import { Markdown } from '@tg-sensei/bot';
import devicesClient from 'devices-client/client';

import { SECOND } from 'constants/date';

import { AddDevicePayload } from 'devices-client/types/device';
import { ActionsStreamAction, MessageAction } from 'telegram-bot/types/actions';
import { InlineKeyboard } from 'telegram-bot/types/keyboard';
import { DevicesClientCallbackButtonType } from 'telegram-bot/types/keyboard/devices-client';

import { getAddDevicePayload } from 'devices-client/utilities/payload';
import { formatEnteredFields } from 'telegram-bot/utilities/actions/devices-client';
import { backToCallbackButton } from 'telegram-bot/utilities/keyboard';

import { getDeviceAction } from 'telegram-bot/actions/devices-client/devices/device/status';
import { userDataProvider } from 'telegram-bot/bot';

const SET_ADDRESS_KEYBOARD: InlineKeyboard = [
  [
    backToCallbackButton('К вводу MAC', {
      type: DevicesClientCallbackButtonType.AddDeviceBackToSetMac,
    }),
  ],
  [
    backToCallbackButton('К устройствам', {
      type: DevicesClientCallbackButtonType.OpenStatus,
    }),
  ],
];

userDataProvider.handle(TelegramUserState.AddDeviceSetAddress, async ({ message, user }) => {
  const address = message.text;

  if (!address) {
    return new MessageAction({
      content: {
        type: 'text',
        text: 'Адрес устройства должно содержать как минимум 1 символ',
      },
      replyMarkup: SET_ADDRESS_KEYBOARD,
    });
  }

  if (!(await devicesClient.isAddressAllowed(address))) {
    return new MessageAction({
      content: {
        type: 'text',
        text: 'Адрес устройства должен быть уникальным',
      },
      replyMarkup: SET_ADDRESS_KEYBOARD,
    });
  }

  const device = await devicesClient.addDevice({
    ...getAddDevicePayload(user.data.addDevicePayload),
    address,
  });

  await userDataProvider.setUserData(user.id, {
    ...user.data,
    state: TelegramUserState.Waiting,
    addDevicePayload: null,
  });

  return new ActionsStreamAction(async function* () {
    yield new MessageAction({
      content: {
        type: 'text',
        text: 'Устройство добавлено!',
      },
    });

    yield getDeviceAction(device.id, {
      timeout: SECOND,
    });
  });
});

export function getAddDeviceSetAddressAction(addDevicePayload: AddDevicePayload): MessageAction {
  return new MessageAction({
    content: {
      type: 'text',
      text: Markdown.create`${formatEnteredFields(addDevicePayload, ['name', 'type', 'manufacturer', 'mac'])}


${Markdown.italic('Введите адрес устройства')}`,
    },
    replyMarkup: SET_ADDRESS_KEYBOARD,
  });
}
