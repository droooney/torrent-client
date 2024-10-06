import { TelegramUserState } from '@prisma/client';
import devicesClient from 'devices-client/client';

import { NotificationAction } from 'telegram-bot/types/actions';
import { DevicesClientCallbackButtonType } from 'telegram-bot/types/keyboard/devices-client';

import DevicesClient from 'devices-client/utilities/DevicesClient';
import { getAddDevicePayload } from 'devices-client/utilities/payload';
import MessageWithNotificationAction from 'telegram-bot/utilities/actions/MessageWithNotificationAction';
import RefreshDataAction from 'telegram-bot/utilities/actions/RefreshDataAction';

import {
  getAddDeviceSetMacAction,
  getAddDeviceSetNameAction,
  getAddDeviceSetTypeAction,
  getDeviceAction,
  getDevicesListAction,
  getStatusAction,
} from 'telegram-bot/actions/devices-client';
import { callbackDataProvider, userDataProvider } from 'telegram-bot/bot';

callbackDataProvider.handle(DevicesClientCallbackButtonType.BackToStatus, async () => {
  return getStatusAction();
});

callbackDataProvider.handle(DevicesClientCallbackButtonType.RefreshStatus, async () => {
  return new RefreshDataAction(await getStatusAction());
});

callbackDataProvider.handle(
  [
    DevicesClientCallbackButtonType.StatusShowDevicesList,
    DevicesClientCallbackButtonType.DevicesListPage,
    DevicesClientCallbackButtonType.BackToDevicesList,
  ],
  async ({ data }) => {
    return getDevicesListAction('page' in data ? data.page : 0);
  },
);

callbackDataProvider.handle(DevicesClientCallbackButtonType.DevicesListRefresh, async ({ data }) => {
  return new RefreshDataAction(
    await (await getDevicesListAction('page' in data ? data.page : 0)).generateMessageAction(),
  );
});

callbackDataProvider.handle(
  [DevicesClientCallbackButtonType.NavigateToDevice, DevicesClientCallbackButtonType.DeviceDelete],
  async ({ data }) => {
    return getDeviceAction(data.deviceId, data.type === DevicesClientCallbackButtonType.DeviceDelete);
  },
);

callbackDataProvider.handle(DevicesClientCallbackButtonType.DeviceRefresh, async ({ data }) => {
  return new RefreshDataAction(await getDeviceAction(data.deviceId));
});

callbackDataProvider.handle(DevicesClientCallbackButtonType.DeviceDeleteConfirm, async ({ data }) => {
  await devicesClient.deleteDevice(data.deviceId);

  return new MessageWithNotificationAction({
    text: 'Устройство успешно удалено',
    updateAction: await (await getDevicesListAction()).generateMessageAction(),
  });
});

callbackDataProvider.handle(
  [DevicesClientCallbackButtonType.AddDevice, DevicesClientCallbackButtonType.AddDeviceBackToSetName],
  async ({ user }) => {
    await userDataProvider.setUserData(user.id, {
      ...user.data,
      state: TelegramUserState.AddDeviceSetName,
      addDevicePayload: DevicesClient.defaultDevicePayload,
    });

    return getAddDeviceSetNameAction();
  },
);

callbackDataProvider.handle(DevicesClientCallbackButtonType.AddDeviceSetType, async ({ data, user }) => {
  const newPayload = {
    ...getAddDevicePayload(user.data.addDevicePayload),
    type: data.deviceType,
  };

  await userDataProvider.setUserData(user.id, {
    ...user.data,
    state: TelegramUserState.AddDeviceSetMac,
    addDevicePayload: newPayload,
  });

  return getAddDeviceSetMacAction(newPayload);
});

callbackDataProvider.handle(DevicesClientCallbackButtonType.AddDeviceBackToSetType, async ({ user }) => {
  await userDataProvider.setUserData(user.id, {
    ...user.data,
    state: TelegramUserState.AddDeviceSetType,
  });

  return getAddDeviceSetTypeAction(getAddDevicePayload(user.data.addDevicePayload));
});

callbackDataProvider.handle(DevicesClientCallbackButtonType.AddDeviceBackToSetMac, async ({ user }) => {
  await userDataProvider.setUserData(user.id, {
    ...user.data,
    state: TelegramUserState.AddDeviceSetMac,
  });

  return getAddDeviceSetMacAction(getAddDevicePayload(user.data.addDevicePayload));
});

callbackDataProvider.handle(DevicesClientCallbackButtonType.DeviceTurnOn, async ({ data }) => {
  await devicesClient.turnOnDevice(data.deviceId);

  return new NotificationAction({
    text: 'Устройство включено',
  });
});
