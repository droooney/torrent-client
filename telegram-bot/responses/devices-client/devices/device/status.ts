import { Markdown, MessageResponse } from '@tg-sensei/bot';
import devicesClient from 'devices-client/client';

import { SECOND } from 'constants/date';

import { DevicesClientCallbackButtonType } from 'telegram-bot/types/keyboard/devices-client';

import {
  activateCallbackButton,
  backToCallbackButton,
  deleteCallbackButton,
  editCallbackButton,
  refreshCallbackButton,
} from 'telegram-bot/utilities/keyboard';
import MessageWithNotificationResponse from 'telegram-bot/utilities/responses/MessageWithNotificationResponse';
import { formatDeviceFields, formatDeviceStateFields } from 'telegram-bot/utilities/responses/devices-client';

import { callbackDataProvider } from 'telegram-bot/bot';
import { getDevicesListResponse } from 'telegram-bot/responses/devices-client/devices/list';

callbackDataProvider.handle(DevicesClientCallbackButtonType.OpenDevice, async (ctx) => {
  const { deviceId, withDeleteConfirm } = ctx.callbackData;

  await ctx.respondWith(
    await getDeviceResponse(deviceId, {
      withDeleteConfirm,
      timeout: SECOND,
    }),
  );
});

callbackDataProvider.handle(DevicesClientCallbackButtonType.DeviceDeleteConfirm, async (ctx) => {
  const { deviceId } = ctx.callbackData;

  await devicesClient.deleteDevice(deviceId);

  await ctx.respondWith(
    new MessageWithNotificationResponse({
      text: 'Устройство успешно удалено',
      updateResponse: getDevicesListResponse(),
    }),
  );
});

callbackDataProvider.handle(DevicesClientCallbackButtonType.DeviceTurnOn, async (ctx) => {
  const { deviceId } = ctx.callbackData;

  await devicesClient.turnOnDevice(deviceId);

  await ctx.respondWith(
    new MessageWithNotificationResponse({
      text: 'Устройство включено',
      updateResponse: await getDeviceResponse(deviceId),
    }),
  );
});

callbackDataProvider.handle(DevicesClientCallbackButtonType.DeviceTurnOff, async (ctx) => {
  const { deviceId } = ctx.callbackData;

  await devicesClient.turnOffDevice(deviceId);

  await ctx.respondWith(
    new MessageWithNotificationResponse({
      text: 'Устройство выключено',
      updateResponse: await getDeviceResponse(deviceId),
    }),
  );
});

export type GetDeviceResponseOptions = {
  withDeleteConfirm?: boolean;
  timeout?: number;
};

export async function getDeviceResponse(
  deviceId: number,
  options: GetDeviceResponseOptions = {},
): Promise<MessageResponse> {
  const { withDeleteConfirm = false, timeout } = options;
  const deviceInfo = await devicesClient.getDeviceInfo(deviceId, {
    timeout,
  });
  const { state: deviceState } = deviceInfo;

  return new MessageResponse({
    content: Markdown.join(
      [
        formatDeviceFields(deviceInfo, ['name']),
        formatDeviceStateFields(deviceInfo.state, ['online', 'power']),
        formatDeviceFields(deviceInfo, ['type', 'manufacturer', 'mac', 'address', 'usedForAtHomeDetection']),
      ],
      '\n',
    ),
    replyMarkup: await callbackDataProvider.buildInlineKeyboard([
      [
        refreshCallbackButton({
          type: DevicesClientCallbackButtonType.OpenDevice,
          deviceId,
          isRefresh: true,
        }),
        deleteCallbackButton(
          withDeleteConfirm,
          {
            type: DevicesClientCallbackButtonType.DeviceDeleteConfirm,
            deviceId,
          },
          {
            type: DevicesClientCallbackButtonType.OpenDevice,
            deviceId,
            withDeleteConfirm: true,
          },
        ),
      ],
      [
        activateCallbackButton(deviceState.power === true, (isActive) => ({
          type: isActive ? DevicesClientCallbackButtonType.DeviceTurnOff : DevicesClientCallbackButtonType.DeviceTurnOn,
          deviceId,
        })),
      ],
      [
        editCallbackButton({
          type: DevicesClientCallbackButtonType.EditDevice,
          deviceId,
        }),
      ],
      [
        backToCallbackButton('К списку устройств', {
          type: DevicesClientCallbackButtonType.OpenDevicesList,
        }),
      ],
    ]),
  });
}
