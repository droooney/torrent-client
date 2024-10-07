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

export type AddDevicePayload = z.infer<typeof addDevicePayloadSchema>;

export type AddDevicePayloadField = keyof AddDevicePayload;
