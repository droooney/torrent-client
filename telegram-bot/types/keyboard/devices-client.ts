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

export const devicesClientCallbackDataSchema = z.union([
  z.object({
    $: z.literal(DevicesClientCallbackButtonSource.REFRESH_STATUS),
  }),

  z.object({
    $: z.literal(DevicesClientCallbackButtonSource.BACK_TO_STATUS),
  }),

  z.object({
    $: z.literal(DevicesClientCallbackButtonSource.STATUS_SHOW_DEVICES_LIST),
  }),

  z.object({
    $: z.literal(DevicesClientCallbackButtonSource.BACK_TO_DEVICES_LIST),
  }),

  z.object({
    $: z.literal(DevicesClientCallbackButtonSource.DEVICES_LIST_REFRESH),
    p: z.number(),
  }),

  z.object({
    $: z.literal(DevicesClientCallbackButtonSource.DEVICES_LIST_PAGE),
    p: z.number(),
  }),

  z.object({
    $: z.literal(DevicesClientCallbackButtonSource.NAVIGATE_TO_DEVICE),
    d: z.number(),
  }),

  z.object({
    $: z.literal(DevicesClientCallbackButtonSource.ADD_DEVICE),
  }),

  z.object({
    $: z.literal(DevicesClientCallbackButtonSource.ADD_DEVICE_SET_TYPE),
    t: uglifiedDeviceTypeSchema,
  }),

  z.object({
    $: z.literal(DevicesClientCallbackButtonSource.ADD_DEVICE_BACK_TO_SET_NAME),
  }),

  z.object({
    $: z.literal(DevicesClientCallbackButtonSource.ADD_DEVICE_BACK_TO_SET_TYPE),
  }),

  z.object({
    $: z.literal(DevicesClientCallbackButtonSource.ADD_DEVICE_BACK_TO_SET_MAC),
  }),

  z.object({
    $: z.literal(DevicesClientCallbackButtonSource.DEVICE_REFRESH),
    d: z.number(),
  }),

  z.object({
    $: z.literal(DevicesClientCallbackButtonSource.DEVICE_DELETE),
    d: z.number(),
  }),

  z.object({
    $: z.literal(DevicesClientCallbackButtonSource.DEVICE_DELETE_CONFIRM),
    d: z.number(),
  }),
]);

export type DevicesClientBeautifiedCallbackData =
  | {
      source: DevicesClientCallbackButtonSource.REFRESH_STATUS;
    }
  | {
      source: DevicesClientCallbackButtonSource.BACK_TO_STATUS;
    }
  | {
      source: DevicesClientCallbackButtonSource.STATUS_SHOW_DEVICES_LIST;
    }
  | {
      source: DevicesClientCallbackButtonSource.BACK_TO_DEVICES_LIST;
    }
  | {
      source: DevicesClientCallbackButtonSource.DEVICES_LIST_REFRESH;
      page: number;
    }
  | {
      source: DevicesClientCallbackButtonSource.DEVICES_LIST_PAGE;
      page: number;
    }
  | {
      source: DevicesClientCallbackButtonSource.NAVIGATE_TO_DEVICE;
      deviceId: number;
    }
  | {
      source: DevicesClientCallbackButtonSource.ADD_DEVICE;
    }
  | {
      source: DevicesClientCallbackButtonSource.ADD_DEVICE_SET_TYPE;
      type: DeviceType;
    }
  | {
      source: DevicesClientCallbackButtonSource.ADD_DEVICE_BACK_TO_SET_TYPE;
    }
  | {
      source: DevicesClientCallbackButtonSource.ADD_DEVICE_BACK_TO_SET_NAME;
    }
  | {
      source: DevicesClientCallbackButtonSource.ADD_DEVICE_BACK_TO_SET_MAC;
    }
  | {
      source: DevicesClientCallbackButtonSource.DEVICE_REFRESH;
      deviceId: number;
    }
  | {
      source: DevicesClientCallbackButtonSource.DEVICE_DELETE;
      deviceId: number;
    }
  | {
      source: DevicesClientCallbackButtonSource.DEVICE_DELETE_CONFIRM;
      deviceId: number;
    };
