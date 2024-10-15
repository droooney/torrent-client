import { z } from 'zod';

import { deviceManufacturerSchema, deviceTypeSchema } from 'devices-client/types/device';

// next number is 27
export enum DevicesClientCallbackButtonType {
  // Status
  OpenStatus = 'd2',

  // Devices list
  OpenDevicesList = 'd10',

  // Add device
  AddDeviceSetName = 'd5',
  AddDeviceSetType = 'd4',
  AddDeviceType = 'd3',
  AddDeviceSetManufacturer = 'd17',
  AddDeviceManufacturer = 'd16',
  AddDeviceSetMac = 'd6',

  // Device
  OpenDevice = 'd11',
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
    type: z.literal(DevicesClientCallbackButtonType.OpenStatus),
    isRefresh: z.optional(z.boolean()),
  }),

  z.object({
    type: z.literal(DevicesClientCallbackButtonType.OpenDevicesList),
    page: z.optional(z.number()),
    isRefresh: z.optional(z.boolean()),
  }),

  z.object({
    type: z.literal(DevicesClientCallbackButtonType.AddDeviceSetName),
    isBack: z.optional(z.boolean()),
  }),

  z.object({
    type: z.literal(DevicesClientCallbackButtonType.AddDeviceType),
    deviceType: deviceTypeSchema,
  }),

  z.object({
    type: z.literal(DevicesClientCallbackButtonType.AddDeviceManufacturer),
    manufacturer: deviceManufacturerSchema,
  }),

  z.object({
    type: z.literal(DevicesClientCallbackButtonType.AddDeviceSetType),
  }),

  z.object({
    type: z.literal(DevicesClientCallbackButtonType.AddDeviceSetManufacturer),
  }),

  z.object({
    type: z.literal(DevicesClientCallbackButtonType.AddDeviceSetMac),
  }),

  z.object({
    type: z.literal(DevicesClientCallbackButtonType.OpenDevice),
    deviceId: z.number(),
    withDeleteConfirm: z.optional(z.boolean()),
    isRefresh: z.optional(z.boolean()),
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
