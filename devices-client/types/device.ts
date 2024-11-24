import { DeviceManufacturer, DeviceType } from '@prisma/client';
import { z } from 'zod';

export const deviceTypeSchema = z.nativeEnum(DeviceType);

export const deviceManufacturerSchema = z.nativeEnum(DeviceManufacturer);

export const addDevicePayloadSchema = z.object({
  name: z.string(),
  type: deviceTypeSchema,
  manufacturer: deviceManufacturerSchema,
  mac: z.nullable(z.string()),
  address: z.nullable(z.string()),
  matterPairingCode: z.nullable(z.string()),
});

export type AddDevicePayload = z.TypeOf<typeof addDevicePayloadSchema>;

export type AddDevicePayloadField = Exclude<keyof AddDevicePayload, 'matterPairingCode'>;

export const editDevicePayloadSchema = z.object({
  deviceId: z.number(),
});

export type EditDevicePayload = z.TypeOf<typeof editDevicePayloadSchema>;
