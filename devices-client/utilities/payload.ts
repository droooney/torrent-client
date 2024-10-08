import {
  AddDevicePayload,
  EditDevicePayload,
  addDevicePayloadSchema,
  editDevicePayloadSchema,
} from 'devices-client/types/device';

import DevicesClient from 'devices-client/utilities/DevicesClient';

export function getAddDevicePayload(payload: unknown): AddDevicePayload {
  const parsedPayload = addDevicePayloadSchema.safeParse(payload);

  return parsedPayload.success ? parsedPayload.data : DevicesClient.defaultDevicePayload;
}

export function getEditDevicePayload(payload: unknown): EditDevicePayload | null {
  const parsedPayload = editDevicePayloadSchema.safeParse(payload);

  return parsedPayload.success ? parsedPayload.data : null;
}
