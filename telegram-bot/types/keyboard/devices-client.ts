import { z } from 'zod';

import { deviceManufacturerSchema, deviceTypeSchema } from 'devices-client/types/device';

// next number is 27
export enum DevicesClientCallbackButtonType {
  // Status
  OpenStatus = 'd2',
  RefreshStatus = 'd0',

  // Devices list
  OpenDevicesList = 'd10',
  RefreshDevicesList = 'd13',

  // Add device
  AddDevice = 'd1',
  AddDeviceSetType = 'd3',
  AddDeviceSetManufacturer = 'd16',
  AddDeviceBackToSetName = 'd5',
  AddDeviceBackToSetType = 'd4',
  AddDeviceBackToSetManufacturer = 'd17',
  AddDeviceBackToSetMac = 'd6',

  // Device
  OpenDevice = 'd11',
  DeviceRefresh = 'd7',
  DeviceDelete = 'd8',
  DeviceDeleteConfirm = 'd9',
  DeviceTurnOn = 'd15',
  DeviceTurnOff = 'd18',

  // Edit device
  EditDevice = 'd19',
  EditDeviceName = 'd20',
  EditDeviceManufacturer = 'd21',
  EditDeviceSetManufacturer = 'd26',
  EditDeviceMac = 'd22',
  EditDeviceAddress = 'd23',
}

export const devicesClientCallbackDataSchema = z.union([
  z.object({
    type: z.literal(DevicesClientCallbackButtonType.RefreshStatus),
  }),

  z.object({
    type: z.literal(DevicesClientCallbackButtonType.OpenStatus),
  }),

  z.object({
    type: z.literal(DevicesClientCallbackButtonType.OpenDevicesList),
    page: z.optional(z.number()),
  }),

  z.object({
    type: z.literal(DevicesClientCallbackButtonType.RefreshDevicesList),
    page: z.number(),
  }),

  z.object({
    type: z.literal(DevicesClientCallbackButtonType.OpenDevice),
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

  z.object({
    type: z.literal(DevicesClientCallbackButtonType.EditDevice),
    deviceId: z.number(),
  }),

  z.object({
    type: z.literal(DevicesClientCallbackButtonType.EditDeviceName),
    deviceId: z.number(),
  }),

  z.object({
    type: z.literal(DevicesClientCallbackButtonType.EditDeviceManufacturer),
    deviceId: z.number(),
  }),

  z.object({
    type: z.literal(DevicesClientCallbackButtonType.EditDeviceSetManufacturer),
    deviceId: z.number(),
    manufacturer: deviceManufacturerSchema,
  }),

  z.object({
    type: z.literal(DevicesClientCallbackButtonType.EditDeviceMac),
    deviceId: z.number(),
  }),

  z.object({
    type: z.literal(DevicesClientCallbackButtonType.EditDeviceAddress),
    deviceId: z.number(),
  }),
]);
