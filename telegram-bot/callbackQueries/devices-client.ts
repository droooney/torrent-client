import { DeviceManufacturer, DeviceType, TelegramUserState } from '@prisma/client';
import devicesClient from 'devices-client/client';

import { AddDevicePayload, EditDevicePayload } from 'devices-client/types/device';
import { MessageAction } from 'telegram-bot/types/actions';
import { DevicesClientCallbackButtonType } from 'telegram-bot/types/keyboard/devices-client';

import DevicesClient from 'devices-client/utilities/DevicesClient';
import { getAddDevicePayload } from 'devices-client/utilities/payload';
import MessageWithNotificationAction from 'telegram-bot/utilities/actions/MessageWithNotificationAction';
import RefreshDataAction from 'telegram-bot/utilities/actions/RefreshDataAction';
import { callbackButton } from 'telegram-bot/utilities/keyboard';

import {
  getAddDeviceSetMacAction,
  getAddDeviceSetManufacturerAction,
  getAddDeviceSetNameAction,
  getAddDeviceSetTypeAction,
  getBackToEditDeviceKeyboard,
  getDeviceAction,
  getDevicesListAction,
  getEditDeviceAction,
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
  [
    DevicesClientCallbackButtonType.NavigateToDevice,
    DevicesClientCallbackButtonType.DeviceDelete,
    DevicesClientCallbackButtonType.BackToDevice,
  ],
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
  const newPayload: AddDevicePayload = {
    ...getAddDevicePayload(user.data.addDevicePayload),
    type: data.deviceType,
  };

  await userDataProvider.setUserData(user.id, {
    ...user.data,
    state: TelegramUserState.AddDeviceSetManufacturer,
    addDevicePayload: newPayload,
  });

  return getAddDeviceSetManufacturerAction(newPayload);
});

callbackDataProvider.handle(DevicesClientCallbackButtonType.AddDeviceSetManufacturer, async ({ data, user }) => {
  const newPayload: AddDevicePayload = {
    ...getAddDevicePayload(user.data.addDevicePayload),
    manufacturer: data.manufacturer,
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

callbackDataProvider.handle(DevicesClientCallbackButtonType.AddDeviceBackToSetManufacturer, async ({ user }) => {
  await userDataProvider.setUserData(user.id, {
    ...user.data,
    state: TelegramUserState.AddDeviceSetManufacturer,
  });

  return getAddDeviceSetManufacturerAction(getAddDevicePayload(user.data.addDevicePayload));
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

callbackDataProvider.handle(
  [DevicesClientCallbackButtonType.DeviceEdit, DevicesClientCallbackButtonType.BackToEditDevice],
  async ({ data }) => {
    return getEditDeviceAction(data.deviceId);
  },
);

callbackDataProvider.handle(DevicesClientCallbackButtonType.EditDeviceName, async ({ data, user }) => {
  const newPayload: EditDevicePayload = {
    deviceId: data.deviceId,
  };

  await userDataProvider.setUserData(user.id, {
    ...user.data,
    state: TelegramUserState.EditDeviceName,
    editDevicePayload: newPayload,
  });

  return new MessageAction({
    content: {
      type: 'text',
      text: 'Введите новое название',
    },
    replyMarkup: getBackToEditDeviceKeyboard(data.deviceId),
  });
});

callbackDataProvider.handle(DevicesClientCallbackButtonType.EditDeviceManufacturer, async ({ data }) => {
  return new MessageAction({
    content: {
      type: 'text',
      text: 'Выберите нового производителя',
    },
    replyMarkup: [
      [
        ...Object.values(DeviceManufacturer).map((manufacturer) =>
          callbackButton('', manufacturer === DeviceType.Other ? 'Другой' : manufacturer, {
            type: DevicesClientCallbackButtonType.EditDeviceSetManufacturer,
            deviceId: data.deviceId,
            manufacturer,
          }),
        ),
      ],
      ...getBackToEditDeviceKeyboard(data.deviceId),
    ],
  });
});

callbackDataProvider.handle(DevicesClientCallbackButtonType.EditDeviceSetManufacturer, async ({ data }) => {
  await devicesClient.editDevice(data.deviceId, {
    manufacturer: data.manufacturer,
  });

  return new MessageWithNotificationAction({
    text: 'Производитель изменен',
    updateAction: await getEditDeviceAction(data.deviceId),
  });
});

callbackDataProvider.handle(DevicesClientCallbackButtonType.EditDeviceMac, async ({ data, user }) => {
  const newPayload: EditDevicePayload = {
    deviceId: data.deviceId,
  };

  await userDataProvider.setUserData(user.id, {
    ...user.data,
    state: TelegramUserState.EditDeviceMac,
    editDevicePayload: newPayload,
  });

  return new MessageAction({
    content: {
      type: 'text',
      text: 'Введите новый MAC. Вбейте "-", чтобы удалить',
    },
    replyMarkup: getBackToEditDeviceKeyboard(data.deviceId),
  });
});

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
