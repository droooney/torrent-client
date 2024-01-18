import { DeviceType } from '@prisma/client';

import { BeautifyCallbackDataMapper, UglifyCallbackDataMapper } from 'telegram-bot/types/keyboard';
import { DevicesClientCallbackButtonSource, UglifiedDeviceType } from 'telegram-bot/types/keyboard/devices-client';

const uglifyDeviceTypeMap: Record<DeviceType, UglifiedDeviceType> = {
  [DeviceType.Tv]: 0,
};

const beautifyDeviceTypeMap: Record<UglifiedDeviceType, DeviceType> = [DeviceType.Tv];

export const devicesClientUglifyCallbackDataMapper: UglifyCallbackDataMapper<DevicesClientCallbackButtonSource> = {
  [DevicesClientCallbackButtonSource.DEVICES_LIST_REFRESH]: ({ page }) => ({
    p: page,
  }),
  [DevicesClientCallbackButtonSource.DEVICES_LIST_PAGE]: ({ page }) => ({
    p: page,
  }),
  [DevicesClientCallbackButtonSource.NAVIGATE_TO_DEVICE]: ({ deviceId }) => ({
    d: deviceId,
  }),
  [DevicesClientCallbackButtonSource.ADD_DEVICE_SET_TYPE]: ({ type }) => ({
    t: uglifyDeviceTypeMap[type],
  }),
  [DevicesClientCallbackButtonSource.DEVICE_REFRESH]: ({ deviceId }) => ({
    d: deviceId,
  }),
  [DevicesClientCallbackButtonSource.DEVICE_DELETE]: ({ deviceId }) => ({
    d: deviceId,
  }),
  [DevicesClientCallbackButtonSource.DEVICE_DELETE_CONFIRM]: ({ deviceId }) => ({
    d: deviceId,
  }),
  [DevicesClientCallbackButtonSource.DEVICE_TURN_ON]: ({ deviceId }) => ({
    d: deviceId,
  }),
};

export const devicesClientBeautifyCallbackDataMapper: BeautifyCallbackDataMapper<DevicesClientCallbackButtonSource> = {
  [DevicesClientCallbackButtonSource.DEVICES_LIST_REFRESH]: ({ p }) => ({
    page: p,
  }),
  [DevicesClientCallbackButtonSource.DEVICES_LIST_PAGE]: ({ p }) => ({
    page: p,
  }),
  [DevicesClientCallbackButtonSource.NAVIGATE_TO_DEVICE]: ({ d }) => ({
    deviceId: d,
  }),
  [DevicesClientCallbackButtonSource.ADD_DEVICE_SET_TYPE]: ({ t }) => ({
    type: beautifyDeviceTypeMap[t],
  }),
  [DevicesClientCallbackButtonSource.DEVICE_REFRESH]: ({ d }) => ({
    deviceId: d,
  }),
  [DevicesClientCallbackButtonSource.DEVICE_DELETE]: ({ d }) => ({
    deviceId: d,
  }),
  [DevicesClientCallbackButtonSource.DEVICE_DELETE_CONFIRM]: ({ d }) => ({
    deviceId: d,
  }),
  [DevicesClientCallbackButtonSource.DEVICE_TURN_ON]: ({ d }) => ({
    deviceId: d,
  }),
};
