import { AddDevicePayload, addDevicePayloadSchema } from 'devices-client/types/device';

import DevicesClient from 'devices-client/utilities/DevicesClient';

export function getAddDevicePayload(payload: unknown): AddDevicePayload {
  const parsedPayload = addDevicePayloadSchema.safeParse(payload);

  return parsedPayload.success ? parsedPayload.data : DevicesClient.defaultDevicePayload;
}
