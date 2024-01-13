import { Prisma, TelegramUserState } from '@prisma/client';
import devicesClient from 'devices-client/client';

import { DevicesClientCallbackButtonSource } from 'telegram-bot/types/keyboard/devices-client';

import { isMac } from 'devices-client/utilities/is';
import { getAddDevicePayload } from 'devices-client/utilities/payload';
import Markdown from 'telegram-bot/utilities/Markdown';
import TelegramResponseError from 'telegram-bot/utilities/TelegramResponseError';
import { callbackButton } from 'telegram-bot/utilities/keyboard';
import ImmediateTextResponse from 'telegram-bot/utilities/response/ImmediateTextResponse';
import { ErrorCode } from 'utilities/CustomError';

import bot from 'telegram-bot/bot';
import { getAddDeviceSetAddressResponse, getAddDeviceSetTypeResponse } from 'telegram-bot/responses/devices-client';

bot.handleUserState(TelegramUserState.AddDeviceSetName, async (ctx) => {
  const name = ctx.message.text;

  if (!name) {
    throw new TelegramResponseError(ErrorCode.WRONG_FORMAT, 'Имя устройства должно содержать как минимум 1 символ', {
      keyboard: [
        [
          callbackButton('◀️', 'К устройствам', {
            source: DevicesClientCallbackButtonSource.BACK_TO_STATUS,
          }),
        ],
      ],
    });
  }

  const newPayload = {
    ...getAddDevicePayload(ctx.userData.addDevicePayload),
    name,
  };

  await ctx.updateUserState({
    state: TelegramUserState.AddDeviceSetType,
    addDevicePayload: newPayload,
  });

  return getAddDeviceSetTypeResponse(newPayload);
});

bot.handleUserState(TelegramUserState.AddDeviceSetType, async (ctx) => {
  return getAddDeviceSetTypeResponse(getAddDevicePayload(ctx.userData.addDevicePayload));
});

bot.handleUserState(TelegramUserState.AddDeviceSetMac, async (ctx) => {
  const mac = ctx.message.text;

  if (!mac || !isMac(mac)) {
    return new ImmediateTextResponse({
      text: Markdown.create`Введите валидный MAC-адрес (пример: ${Markdown.fixedWidth('12:23:56:9f:aa:bb')})`,
      keyboard: [
        [
          callbackButton('◀️', 'К выбору типа', {
            source: DevicesClientCallbackButtonSource.ADD_DEVICE_BACK_TO_SET_TYPE,
          }),
        ],
        [
          callbackButton('◀️', 'К устройствам', {
            source: DevicesClientCallbackButtonSource.BACK_TO_STATUS,
          }),
        ],
      ],
    });
  }

  const newPayload = {
    ...getAddDevicePayload(ctx.userData.addDevicePayload),
    mac,
  };

  await ctx.updateUserState({
    state: TelegramUserState.AddDeviceSetAddress,
    addDevicePayload: newPayload,
  });

  return getAddDeviceSetAddressResponse(newPayload);
});

bot.handleUserState(TelegramUserState.AddDeviceSetAddress, async (ctx) => {
  const address = ctx.message.text;

  if (!address) {
    throw new TelegramResponseError(ErrorCode.WRONG_FORMAT, 'Адрес устройства должно содержать как минимум 1 символ', {
      keyboard: [
        [
          callbackButton('◀️', 'К вводу MAC', {
            source: DevicesClientCallbackButtonSource.ADD_DEVICE_BACK_TO_SET_MAC,
          }),
        ],
        [
          callbackButton('◀️', 'К устройствам', {
            source: DevicesClientCallbackButtonSource.BACK_TO_STATUS,
          }),
        ],
      ],
    });
  }

  await ctx.updateUserState({
    state: TelegramUserState.Waiting,
    addDevicePayload: Prisma.DbNull,
  });

  await devicesClient.addDevice({
    ...getAddDevicePayload(ctx.userData.addDevicePayload),
    address,
  });

  return new ImmediateTextResponse({
    text: 'Устройство добавлено!',
    keyboard: [
      [
        callbackButton('◀️', 'К устройствам', {
          source: DevicesClientCallbackButtonSource.BACK_TO_DEVICES_LIST,
        }),
      ],
    ],
  });
});
