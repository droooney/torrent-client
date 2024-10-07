import { Device, DeviceManufacturer, DeviceType } from '@prisma/client';
import findKey from 'lodash/findKey';

import prisma from 'db/prisma';

import { AddDevicePayload } from 'devices-client/types/device';

import YeelightClient from 'devices-client/utilities/YeelightClient';
import { wakeOnLan } from 'devices-client/utilities/wol';
import CustomError, { ErrorCode } from 'utilities/CustomError';
import { isDefined } from 'utilities/is';

const DEVICE_STRING: Record<DeviceType, string[]> = {
  [DeviceType.Tv]: ['телевизор', 'телек', 'телик'],
  [DeviceType.Lightbulb]: ['лампочка', 'лампочку', 'лампа', 'лампу'],
  [DeviceType.Other]: [],
};

export type DeviceState = {
  power: boolean | 'unknown';
};

export type DeviceInfo = Device & {
  state: DeviceState;
};

export default class DevicesClient {
  static readonly defaultDevicePayload: AddDevicePayload = {
    name: '',
    type: DeviceType.Other,
    manufacturer: DeviceManufacturer.Other,
    mac: '',
    address: '',
  };

  private readonly yeelightClient: YeelightClient;

  constructor() {
    this.yeelightClient = new YeelightClient();
  }

  async addDevice(data: AddDevicePayload): Promise<Device> {
    return prisma.device.create({
      data,
    });
  }

  async getDeviceInfo(deviceId: number): Promise<DeviceInfo> {
    const device = await prisma.device.findUnique({
      where: {
        id: deviceId,
      },
    });

    if (!device) {
      throw new CustomError(ErrorCode.NOT_FOUND, 'Устройство не найдено');
    }

    const deviceInfo: DeviceInfo = {
      ...device,
      state: {
        power: 'unknown',
      },
    };

    if (device.type === DeviceType.Lightbulb && device.manufacturer === DeviceManufacturer.Yeelight) {
      const deviceState = await this.yeelightClient.getState(device.address);

      if (deviceState?.power) {
        deviceInfo.state.power = deviceState.power === 'on';
      }
    }

    return deviceInfo;
  }

  async deleteDevice(deviceId: number): Promise<void> {
    await prisma.device.delete({
      where: {
        id: deviceId,
      },
    });
  }

  async isAddressAllowed(address: string): Promise<boolean> {
    return !(await prisma.device.findFirst({
      where: {
        address,
      },
    }));
  }

  async isMacAllowed(mac: string): Promise<boolean> {
    return !(await prisma.device.findFirst({
      where: {
        mac,
      },
    }));
  }

  async isNameAllowed(name: string): Promise<boolean> {
    return !(await prisma.device.findFirst({
      where: {
        name,
      },
    }));
  }

  async turnOffDevice(deviceId: number): Promise<void> {
    const device = await prisma.device.findUnique({
      where: {
        id: deviceId,
      },
    });

    if (!device) {
      throw new CustomError(ErrorCode.NOT_FOUND, 'Устройство не найдено');
    }

    if (device.type === DeviceType.Lightbulb) {
      if (device.manufacturer === DeviceManufacturer.Yeelight) {
        await this.yeelightClient.turnOffDevice(device.address);
      }

      return;
    }
  }

  async turnOnDevice(deviceId: number): Promise<void> {
    const device = await prisma.device.findUnique({
      where: {
        id: deviceId,
      },
    });

    if (!device) {
      throw new CustomError(ErrorCode.NOT_FOUND, 'Устройство не найдено');
    }

    if (device.type === DeviceType.Lightbulb) {
      if (device.manufacturer === DeviceManufacturer.Yeelight) {
        await this.yeelightClient.turnOnDevice(device.address);
      }

      return;
    }

    await this.wakeDevice(device);
  }

  async findDevice(query: string): Promise<Device | null> {
    const deviceType = findKey(DEVICE_STRING, (strings) => strings.includes(query)) as DeviceType | undefined;

    return prisma.device.findFirst({
      where: {
        OR: [
          {
            name: {
              contains: query,
            },
          },
          ...(deviceType
            ? [
                {
                  type: {
                    in: [deviceType],
                  },
                },
              ]
            : []),
        ],
      },
    });
  }

  private async wakeDevice(device: Device): Promise<void> {
    if (!isDefined(device.mac)) {
      throw new CustomError(ErrorCode.NO_MAC, 'Отсутствует MAC устройства');
    }

    await wakeOnLan({
      mac: device.mac,
      address: device.address,
    });
  }
}
