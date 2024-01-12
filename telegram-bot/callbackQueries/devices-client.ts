import { TelegramUserState } from '@prisma/client';
import devicesClient from 'devices-client/client';

import { DevicesClientCallbackButtonSource } from 'telegram-bot/types/keyboard/devices-client';

import DevicesClient from 'devices-client/utilities/DevicesClient';
import { getAddDevicePayload } from 'devices-client/utilities/payload';
import NotificationResponse from 'telegram-bot/utilities/response/NotificationResponse';
import RefreshNotificationResponse from 'telegram-bot/utilities/response/RefreshNotificationResponse';

import bot from 'telegram-bot/bot';
import {
  getAddDeviceSetMacResponse,
  getAddDeviceSetNameResponse,
  getAddDeviceSetTypeResponse,
  getDeviceResponse,
  getDevicesListResponse,
  getStatusResponse,
} from 'telegram-bot/responses/devices-client';

bot.handleCallbackQuery(DevicesClientCallbackButtonSource.BACK_TO_STATUS, async () => {
  return getStatusResponse();
});

bot.handleCallbackQuery(DevicesClientCallbackButtonSource.REFRESH_STATUS, async () => {
  return new RefreshNotificationResponse(await getStatusResponse());
});

bot.handleCallbackQuery(
  [
    DevicesClientCallbackButtonSource.STATUS_SHOW_DEVICES_LIST,
    DevicesClientCallbackButtonSource.DEVICES_LIST_PAGE,
    DevicesClientCallbackButtonSource.BACK_TO_DEVICES_LIST,
  ],
  async (ctx) => {
    return getDevicesListResponse('page' in ctx.data ? ctx.data.page : 0);
  },
);

bot.handleCallbackQuery(DevicesClientCallbackButtonSource.DEVICES_LIST_REFRESH, async (ctx) => {
  return new RefreshNotificationResponse(
    await (await getDevicesListResponse('page' in ctx.data ? ctx.data.page : 0)).generateImmediateResponse(),
  );
});

bot.handleCallbackQuery(
  [DevicesClientCallbackButtonSource.NAVIGATE_TO_DEVICE, DevicesClientCallbackButtonSource.DEVICE_DELETE],
  async (ctx) => {
    return getDeviceResponse(ctx.data.deviceId, ctx.data.source === DevicesClientCallbackButtonSource.DEVICE_DELETE);
  },
);

bot.handleCallbackQuery(DevicesClientCallbackButtonSource.DEVICE_REFRESH, async (ctx) => {
  return new RefreshNotificationResponse(await getDeviceResponse(ctx.data.deviceId));
});

bot.handleCallbackQuery(DevicesClientCallbackButtonSource.DEVICE_DELETE_CONFIRM, async (ctx) => {
  await devicesClient.deleteDevice(ctx.data.deviceId);

  return new NotificationResponse({
    text: 'Устройство успешно удалено',
    updateMessage: await (await getDevicesListResponse()).generateImmediateResponse(),
  });
});

bot.handleCallbackQuery(
  [DevicesClientCallbackButtonSource.ADD_DEVICE, DevicesClientCallbackButtonSource.ADD_DEVICE_BACK_TO_SET_NAME],
  async (ctx) => {
    await ctx.updateUserState({
      state: TelegramUserState.AddDeviceSetName,
      addDevicePayload: DevicesClient.defaultDevicePayload,
    });

    return getAddDeviceSetNameResponse();
  },
);

bot.handleCallbackQuery(DevicesClientCallbackButtonSource.ADD_DEVICE_SET_TYPE, async (ctx) => {
  const newPayload = {
    ...getAddDevicePayload(ctx.userData.addDevicePayload),
    type: ctx.data.type,
  };

  await ctx.updateUserState({
    state: TelegramUserState.AddDeviceSetMac,
    addDevicePayload: newPayload,
  });

  return getAddDeviceSetMacResponse(newPayload);
});

bot.handleCallbackQuery(DevicesClientCallbackButtonSource.ADD_DEVICE_BACK_TO_SET_TYPE, async (ctx) => {
  await ctx.updateUserState({
    state: TelegramUserState.AddDeviceSetType,
  });

  return getAddDeviceSetTypeResponse(getAddDevicePayload(ctx.userData.addDevicePayload));
});

bot.handleCallbackQuery(DevicesClientCallbackButtonSource.ADD_DEVICE_BACK_TO_SET_MAC, async (ctx) => {
  await ctx.updateUserState({
    state: TelegramUserState.AddDeviceSetMac,
  });

  return getAddDeviceSetMacResponse(getAddDevicePayload(ctx.userData.addDevicePayload));
});
