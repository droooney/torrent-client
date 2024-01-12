import { DeviceType } from '@prisma/client';
import { z } from 'zod';

export const addDevicePayloadSchema = z.object({
  type: z.literal(DeviceType.Tv),
  name: z.string(),
  mac: z.string(),
  address: z.string(),
});

export type AddDevicePayload = z.infer<typeof addDevicePayloadSchema>;

export type AddDevicePayloadField = keyof AddDevicePayload;
