import { Device, DeviceType } from '@prisma/client';

import prisma from 'db/prisma';

import { AddDevicePayload } from 'devices-client/types/device';

export default class DevicesClient {
  static readonly defaultDevicePayload: AddDevicePayload = {
    type: DeviceType.Tv,
    name: '',
    mac: '',
    address: '',
  };

  async addDevice(data: AddDevicePayload): Promise<Device> {
    return prisma.device.create({
      data,
    });
  }

  async deleteDevice(deviceId: number): Promise<void> {
    await prisma.device.delete({
      where: {
        id: deviceId,
      },
    });
  }
}
