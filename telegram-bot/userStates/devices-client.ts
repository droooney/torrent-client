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

const BACK_TO_STATUS_BUTTON = callbackButton('◀️', 'К устройствам', {
  source: DevicesClientCallbackButtonSource.BACK_TO_STATUS,
});

const BACK_TO_SET_TYPE_BUTTON = callbackButton('◀️', 'К выбору типа', {
  source: DevicesClientCallbackButtonSource.ADD_DEVICE_BACK_TO_SET_TYPE,
});

const BACK_TO_SET_MAC_BUTTON = callbackButton('◀️', 'К вводу MAC', {
  source: DevicesClientCallbackButtonSource.ADD_DEVICE_BACK_TO_SET_MAC,
});

bot.handleUserState(TelegramUserState.AddDeviceSetName, async (ctx) => {
  const name = ctx.message.text;

  if (!name) {
    throw new TelegramResponseError(ErrorCode.WRONG_FORMAT, 'Имя устройства должно содержать как минимум 1 символ', {
      keyboard: [[BACK_TO_STATUS_BUTTON]],
    });
  }

  if (!(await devicesClient.isNameAllowed(name))) {
    throw new TelegramResponseError(ErrorCode.ALREADY_ADDED, 'Имя устройства должно быть уникальным', {
      keyboard: [[BACK_TO_STATUS_BUTTON]],
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
  const mac = ctx.message.text?.toUpperCase();

  if (!mac || !isMac(mac)) {
    return new ImmediateTextResponse({
      text: Markdown.create`Введите валидный MAC-адрес (пример: ${Markdown.fixedWidth('12:23:56:9f:aa:bb')})`,
      keyboard: [[BACK_TO_SET_TYPE_BUTTON], [BACK_TO_STATUS_BUTTON]],
    });
  }

  if (!(await devicesClient.isMacAllowed(mac))) {
    throw new TelegramResponseError(ErrorCode.ALREADY_ADDED, 'MAC-адрес должен быть уникальным', {
      keyboard: [[BACK_TO_SET_TYPE_BUTTON], [BACK_TO_STATUS_BUTTON]],
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
      keyboard: [[BACK_TO_SET_MAC_BUTTON], [BACK_TO_STATUS_BUTTON]],
    });
  }

  if (!(await devicesClient.isAddressAllowed(address))) {
    throw new TelegramResponseError(ErrorCode.ALREADY_ADDED, 'Адрес устройства должен быть уникальным', {
      keyboard: [[BACK_TO_SET_MAC_BUTTON], [BACK_TO_STATUS_BUTTON]],
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
    keyboard: [[BACK_TO_STATUS_BUTTON]],
  });
});
