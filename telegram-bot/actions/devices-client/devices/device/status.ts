import { Markdown } from '@tg-sensei/bot';
import devicesClient from 'devices-client/client';

import { SECOND } from 'constants/date';

import { MessageAction } from 'telegram-bot/types/actions';
import { DevicesClientCallbackButtonType } from 'telegram-bot/types/keyboard/devices-client';

import MessageWithNotificationAction from 'telegram-bot/utilities/actions/MessageWithNotificationAction';
import RefreshDataAction from 'telegram-bot/utilities/actions/RefreshDataAction';
import { formatDeviceFields } from 'telegram-bot/utilities/actions/devices-client';
import {
  activateCallbackButton,
  backToCallbackButton,
  deleteCallbackButton,
  editCallbackButton,
  refreshCallbackButton,
} from 'telegram-bot/utilities/keyboard';

import { getDevicesListAction } from 'telegram-bot/actions/devices-client/devices/list';
import { callbackDataProvider } from 'telegram-bot/bot';

callbackDataProvider.handle(DevicesClientCallbackButtonType.OpenDevice, async ({ data }) => {
  const action = await getDeviceAction(data.deviceId, {
    withDeleteConfirm: data.withDeleteConfirm,
    timeout: SECOND,
  });

  return data.isRefresh ? new RefreshDataAction(action) : action;
});

callbackDataProvider.handle(DevicesClientCallbackButtonType.DeviceDeleteConfirm, async ({ data }) => {
  await devicesClient.deleteDevice(data.deviceId);

  return new MessageWithNotificationAction({
    text: 'Устройство успешно удалено',
    updateAction: getDevicesListAction(),
  });
});

callbackDataProvider.handle(DevicesClientCallbackButtonType.DeviceTurnOn, async ({ data }) => {
  await devicesClient.turnOnDevice(data.deviceId);

  return new MessageWithNotificationAction({
    text: 'Устройство включено',
    updateAction: await getDeviceAction(data.deviceId),
  });
});

callbackDataProvider.handle(DevicesClientCallbackButtonType.DeviceTurnOff, async ({ data }) => {
  await devicesClient.turnOffDevice(data.deviceId);

  return new MessageWithNotificationAction({
    text: 'Устройство выключено',
    updateAction: await getDeviceAction(data.deviceId),
  });
});

export type GetDeviceActionOptions = {
  withDeleteConfirm?: boolean;
  timeout?: number;
};

export async function getDeviceAction(deviceId: number, options: GetDeviceActionOptions = {}): Promise<MessageAction> {
  const { withDeleteConfirm = false, timeout } = options;
  const deviceInfo = await devicesClient.getDeviceInfo(deviceId, timeout);
  const { state: deviceState } = deviceInfo;

  return new MessageAction({
    content: {
      type: 'text',
      text: Markdown.create`${formatDeviceFields(deviceInfo, ['name', 'type', 'manufacturer', 'mac', 'address'])}

${Markdown.bold('⚡ Питание:')} ${
        deviceState.power === 'unknown'
          ? Markdown.italic('Неизвестно')
          : deviceState.power
            ? '🟢 Включено'
            : '🔴 Выключено'
      }`,
    },
    replyMarkup: [
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
    ],
  });
}
