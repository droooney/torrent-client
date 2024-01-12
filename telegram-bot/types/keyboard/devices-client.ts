import { DeviceType } from '@prisma/client';
import { z } from 'zod';

export enum DevicesClientCallbackButtonSource {
  // Status
  REFRESH_STATUS = 'd0',
  BACK_TO_STATUS = 'd2',
  STATUS_SHOW_DEVICES_LIST = 'd10',

  // Devices list
  BACK_TO_DEVICES_LIST = 'd14',
  DEVICES_LIST_REFRESH = 'd13',
  DEVICES_LIST_PAGE = 'd12',
  NAVIGATE_TO_DEVICE = 'd11',

  // Add device
  ADD_DEVICE = 'd1',
  ADD_DEVICE_SET_TYPE = 'd3',
  ADD_DEVICE_BACK_TO_SET_NAME = 'd5',
  ADD_DEVICE_BACK_TO_SET_TYPE = 'd4',
  ADD_DEVICE_BACK_TO_SET_MAC = 'd6',

  // Device
  DEVICE_REFRESH = 'd7',
  DEVICE_DELETE = 'd8',
  DEVICE_DELETE_CONFIRM = 'd9',
}

export const uglifiedDeviceTypeSchema = z.literal(0);

export type UglifiedDeviceType = z.infer<typeof uglifiedDeviceTypeSchema>;

export const refreshStatusCallbackDataSchema = z.object({
  $: z.literal(DevicesClientCallbackButtonSource.REFRESH_STATUS),
});

export const backToStatusCallbackDataSchema = z.object({
  $: z.literal(DevicesClientCallbackButtonSource.BACK_TO_STATUS),
});

export const statusShowDevicesListCallbackDataSchema = z.object({
  $: z.literal(DevicesClientCallbackButtonSource.STATUS_SHOW_DEVICES_LIST),
});

export const backToDevicesListCallbackDataSchema = z.object({
  $: z.literal(DevicesClientCallbackButtonSource.BACK_TO_DEVICES_LIST),
});

export const devicesListRefreshCallbackDataSchema = z.object({
  $: z.literal(DevicesClientCallbackButtonSource.DEVICES_LIST_REFRESH),
  p: z.number(),
});

export const devicesListPageCallbackDataSchema = z.object({
  $: z.literal(DevicesClientCallbackButtonSource.DEVICES_LIST_PAGE),
  p: z.number(),
});

export const navigateToDeviceCallbackDataSchema = z.object({
  $: z.literal(DevicesClientCallbackButtonSource.NAVIGATE_TO_DEVICE),
  d: z.number(),
});

export const addDeviceCallbackDataSchema = z.object({
  $: z.literal(DevicesClientCallbackButtonSource.ADD_DEVICE),
});

export const addDeviceSetTypeCallbackDataSchema = z.object({
  $: z.literal(DevicesClientCallbackButtonSource.ADD_DEVICE_SET_TYPE),
  t: uglifiedDeviceTypeSchema,
});

export const addDeviceBackToSetNameCallbackDataSchema = z.object({
  $: z.literal(DevicesClientCallbackButtonSource.ADD_DEVICE_BACK_TO_SET_NAME),
});

export const addDeviceBackToSetTypeCallbackDataSchema = z.object({
  $: z.literal(DevicesClientCallbackButtonSource.ADD_DEVICE_BACK_TO_SET_TYPE),
});

export const addDeviceBackToSetMacCallbackDataSchema = z.object({
  $: z.literal(DevicesClientCallbackButtonSource.ADD_DEVICE_BACK_TO_SET_MAC),
});

export const deviceRefreshCallbackDataSchema = z.object({
  $: z.literal(DevicesClientCallbackButtonSource.DEVICE_REFRESH),
  d: z.number(),
});

export const deviceDeleteCallbackDataSchema = z.object({
  $: z.literal(DevicesClientCallbackButtonSource.DEVICE_DELETE),
  d: z.number(),
});

export const deviceDeleteConfirmCallbackDataSchema = z.object({
  $: z.literal(DevicesClientCallbackButtonSource.DEVICE_DELETE_CONFIRM),
  d: z.number(),
});

export const devicesClientCallbackDataSchema = z.union([
  refreshStatusCallbackDataSchema,
  backToStatusCallbackDataSchema,
  statusShowDevicesListCallbackDataSchema,
  backToDevicesListCallbackDataSchema,
  devicesListRefreshCallbackDataSchema,
  devicesListPageCallbackDataSchema,
  navigateToDeviceCallbackDataSchema,
  addDeviceCallbackDataSchema,
  addDeviceSetTypeCallbackDataSchema,
  addDeviceBackToSetNameCallbackDataSchema,
  addDeviceBackToSetTypeCallbackDataSchema,
  addDeviceBackToSetMacCallbackDataSchema,
  deviceRefreshCallbackDataSchema,
  deviceDeleteCallbackDataSchema,
  deviceDeleteConfirmCallbackDataSchema,
]);

export interface RefreshStatusCallbackData {
  source: z.infer<typeof refreshStatusCallbackDataSchema>['$'];
}

export interface BackToStatusCallbackData {
  source: z.infer<typeof backToStatusCallbackDataSchema>['$'];
}

export interface StatusShowDevicesListCallbackData {
  source: z.infer<typeof statusShowDevicesListCallbackDataSchema>['$'];
}

export interface BackToDevicesListCallbackData {
  source: z.infer<typeof backToDevicesListCallbackDataSchema>['$'];
}

export interface DevicesListRefreshCallbackData {
  source: z.infer<typeof devicesListRefreshCallbackDataSchema>['$'];
  page: z.infer<typeof devicesListRefreshCallbackDataSchema>['p'];
}

export interface DevicesListPageCallbackData {
  source: z.infer<typeof devicesListPageCallbackDataSchema>['$'];
  page: z.infer<typeof devicesListPageCallbackDataSchema>['p'];
}

export interface NavigateToDeviceCallbackData {
  source: z.infer<typeof navigateToDeviceCallbackDataSchema>['$'];
  deviceId: z.infer<typeof navigateToDeviceCallbackDataSchema>['d'];
}

export interface AddDeviceCallbackData {
  source: z.infer<typeof addDeviceCallbackDataSchema>['$'];
}

export interface AddDeviceSetTypeCallbackData {
  source: z.infer<typeof addDeviceSetTypeCallbackDataSchema>['$'];
  type: DeviceType;
}

export interface AddDeviceBackToSetNameCallbackData {
  source: z.infer<typeof addDeviceBackToSetNameCallbackDataSchema>['$'];
}

export interface AddDeviceBackToSetTypeCallbackData {
  source: z.infer<typeof addDeviceBackToSetTypeCallbackDataSchema>['$'];
}

export interface AddDeviceBackToSetMacCallbackData {
  source: z.infer<typeof addDeviceBackToSetMacCallbackDataSchema>['$'];
}

export interface DeviceRefreshCallbackData {
  source: z.infer<typeof deviceRefreshCallbackDataSchema>['$'];
  deviceId: z.infer<typeof deviceRefreshCallbackDataSchema>['d'];
}

export interface DeviceDeleteCallbackData {
  source: z.infer<typeof deviceDeleteCallbackDataSchema>['$'];
  deviceId: z.infer<typeof deviceDeleteCallbackDataSchema>['d'];
}

export interface DeviceDeleteConfirmCallbackData {
  source: z.infer<typeof deviceDeleteConfirmCallbackDataSchema>['$'];
  deviceId: z.infer<typeof deviceDeleteConfirmCallbackDataSchema>['d'];
}

export type DevicesClientBeautifiedCallbackData =
  | RefreshStatusCallbackData
  | BackToStatusCallbackData
  | StatusShowDevicesListCallbackData
  | BackToDevicesListCallbackData
  | DevicesListRefreshCallbackData
  | DevicesListPageCallbackData
  | AddDeviceCallbackData
  | AddDeviceSetTypeCallbackData
  | AddDeviceBackToSetTypeCallbackData
  | AddDeviceBackToSetNameCallbackData
  | AddDeviceBackToSetMacCallbackData
  | NavigateToDeviceCallbackData
  | DeviceRefreshCallbackData
  | DeviceDeleteCallbackData
  | DeviceDeleteConfirmCallbackData;
