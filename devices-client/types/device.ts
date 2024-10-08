import { DeviceManufacturer, DeviceType } from '@prisma/client';
import { z } from 'zod';

export const deviceTypeSchema = z.enum([DeviceType.Tv, DeviceType.Lightbulb, DeviceType.Other]);

export const deviceManufacturerSchema = z.enum([
  DeviceManufacturer.Haier,
  DeviceManufacturer.Yeelight,
  DeviceManufacturer.Other,
]);

export const addDevicePayloadSchema = z.object({
  name: z.string(),
  type: deviceTypeSchema,
  manufacturer: deviceManufacturerSchema,
  mac: z.nullable(z.string()),
  address: z.string(),
});

export type AddDevicePayload = z.TypeOf<typeof addDevicePayloadSchema>;

export type AddDevicePayloadField = keyof AddDevicePayload;

export const editDevicePayloadSchema = z.object({
  deviceId: z.number(),
});

export type EditDevicePayload = z.TypeOf<typeof editDevicePayloadSchema>;
