import { z } from 'zod';

import { deviceManufacturerSchema, deviceTypeSchema } from 'devices-client/types/device';

export enum DevicesClientCallbackButtonType {
  // Status
  RefreshStatus = 'd0',
  BackToStatus = 'd2',
  StatusShowDevicesList = 'd10',

  // Devices list
  BackToDevicesList = 'd14',
  DevicesListRefresh = 'd13',
  DevicesListPage = 'd12',
  NavigateToDevice = 'd11',

  // Add device
  AddDevice = 'd1',
  AddDeviceSetType = 'd3',
  AddDeviceSetManufacturer = 'd16',
  AddDeviceBackToSetName = 'd5',
  AddDeviceBackToSetType = 'd4',
  AddDeviceBackToSetManufacturer = 'd17',
  AddDeviceBackToSetMac = 'd6',

  // Device
  DeviceRefresh = 'd7',
  DeviceDelete = 'd8',
  DeviceDeleteConfirm = 'd9',
  DeviceTurnOn = 'd15',
  DeviceTurnOff = 'd18',
}

export const devicesClientCallbackDataSchema = z.union([
  z.object({
    type: z.literal(DevicesClientCallbackButtonType.RefreshStatus),
  }),

  z.object({
    type: z.literal(DevicesClientCallbackButtonType.BackToStatus),
  }),

  z.object({
    type: z.literal(DevicesClientCallbackButtonType.StatusShowDevicesList),
  }),

  z.object({
    type: z.literal(DevicesClientCallbackButtonType.BackToDevicesList),
  }),

  z.object({
    type: z.literal(DevicesClientCallbackButtonType.DevicesListRefresh),
    page: z.number(),
  }),

  z.object({
    type: z.literal(DevicesClientCallbackButtonType.DevicesListPage),
    page: z.number(),
  }),

  z.object({
    type: z.literal(DevicesClientCallbackButtonType.NavigateToDevice),
    deviceId: z.number(),
  }),

  z.object({
    type: z.literal(DevicesClientCallbackButtonType.AddDevice),
  }),

  z.object({
    type: z.literal(DevicesClientCallbackButtonType.AddDeviceSetType),
    deviceType: deviceTypeSchema,
  }),

  z.object({
    type: z.literal(DevicesClientCallbackButtonType.AddDeviceSetManufacturer),
    manufacturer: deviceManufacturerSchema,
  }),

  z.object({
    type: z.literal(DevicesClientCallbackButtonType.AddDeviceBackToSetName),
  }),

  z.object({
    type: z.literal(DevicesClientCallbackButtonType.AddDeviceBackToSetType),
  }),

  z.object({
    type: z.literal(DevicesClientCallbackButtonType.AddDeviceBackToSetManufacturer),
  }),

  z.object({
    type: z.literal(DevicesClientCallbackButtonType.AddDeviceBackToSetMac),
  }),

  z.object({
    type: z.literal(DevicesClientCallbackButtonType.DeviceRefresh),
    deviceId: z.number(),
  }),

  z.object({
    type: z.literal(DevicesClientCallbackButtonType.DeviceDelete),
    deviceId: z.number(),
  }),

  z.object({
    type: z.literal(DevicesClientCallbackButtonType.DeviceDeleteConfirm),
    deviceId: z.number(),
  }),

  z.object({
    type: z.literal(DevicesClientCallbackButtonType.DeviceTurnOn),
    deviceId: z.number(),
  }),

  z.object({
    type: z.literal(DevicesClientCallbackButtonType.DeviceTurnOff),
    deviceId: z.number(),
  }),
]);
