import routerClient from '@/router-client/client';
import { Device, DeviceManufacturer, DeviceType } from '@prisma/client';
import findKey from 'lodash/findKey';
import scenariosManager from 'scenarios-manager/manager';

import { SECOND } from 'constants/date';

import prisma from 'db/prisma';

import { AddDevicePayload } from 'devices-client/types/device';
import { RouterDevice } from 'router-client/types';

import MatterClient, { CommissionedNodeInfo } from 'devices-client/utilities/MatterClient';
import YeelightClient from 'devices-client/utilities/YeelightClient';
import { wakeOnLan } from 'devices-client/utilities/wol';
import CustomError, { ErrorCode } from 'utilities/CustomError';
import { isDefined } from 'utilities/is';
import { timed } from 'utilities/promise';

const DEVICE_STRING: Record<DeviceType, string[]> = {
  [DeviceType.Tv]: ['телевизор', 'телек', 'телик'],
  [DeviceType.Lightbulb]: ['лампочка', 'лампочку', 'лампа', 'лампу'],
  [DeviceType.Socket]: ['розетка', 'розетку'],
  [DeviceType.Other]: [],
  [DeviceType.Unknown]: [],
};

export type DeviceState = {
  online: boolean;
  power: boolean | 'unknown';
};

export type DeviceInfo = Device & {
  state: DeviceState;
};

type GetDeviceInfoOptions = {
  timeout?: number;
  routerDevices?: RouterDevice[];
};

export type DeviceAddressAndMac = {
  address: string | null;
  mac: string | null;
};

const DEFAULT_TIMEOUT = 5 * SECOND;

export default class DevicesClient {
  static readonly defaultDevicePayload: AddDevicePayload = {
    name: '',
    type: DeviceType.Other,
    manufacturer: DeviceManufacturer.Other,
    mac: null,
    address: null,
    usedForAtHomeDetection: false,
    matterPairingCode: null,
  };

  private readonly yeelightClient: YeelightClient;
  private readonly matterClient: MatterClient;

  constructor() {
    this.yeelightClient = new YeelightClient();
    this.matterClient = new MatterClient();
  }

  async addDevice(payload: AddDevicePayload & { matterNodeId?: bigint | null }): Promise<Device> {
    const { matterPairingCode, matterNodeId, ...data } = payload;

    return prisma.device.create({
      data: {
        ...data,
        ...(await this.getDeviceAddressAndMac(payload)),
        matterNodeId: isDefined(matterNodeId) ? String(matterNodeId) : null,
      },
    });
  }

  async commissionMatterDevice(pairingCode: string): Promise<CommissionedNodeInfo> {
    return this.matterClient.commissionDevice(pairingCode);
  }

  async decommissionMatterDevice(matterNodeId: bigint): Promise<void> {
    await this.matterClient.removeNode(matterNodeId);
  }

  async deleteDevice(deviceId: number): Promise<void> {
    const device = await this.getDevice(deviceId);

    if (!device) {
      return;
    }

    if (device.matterNodeId) {
      await this.matterClient.removeNode(BigInt(device.matterNodeId));
    }

    if (device.type === DeviceType.Lightbulb && device.manufacturer === DeviceManufacturer.Yeelight) {
      const { address: deviceIp } = await this.getDeviceAddressAndMac(device);

      if (isDefined(deviceIp)) {
        this.yeelightClient.removeDevice(deviceIp);
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.device.delete({
        where: {
          id: deviceId,
        },
      });

      await scenariosManager.deleteScenarioRelatedDeviceData(deviceId, tx);
    });
  }

  async editDevice(deviceId: number, data: Partial<Device>): Promise<void> {
    await prisma.device.update({
      where: {
        id: deviceId,
      },
      data,
    });
  }

  async findDevice(query: string): Promise<Device> {
    const deviceType = findKey(DEVICE_STRING, (strings) => strings.includes(query)) as DeviceType | undefined;

    const deviceByName = await prisma.device.findFirst({
      where: {
        name: {
          contains: query,
          mode: 'insensitive',
        },
      },
    });

    if (deviceByName) {
      return deviceByName;
    }

    if (deviceType) {
      const deviceByType = await prisma.device.findFirst({
        where: {
          type: {
            in: [deviceType],
          },
        },
      });

      if (deviceByType) {
        return deviceByType;
      }
    }

    throw new CustomError(ErrorCode.NOT_FOUND, 'Устройство не найдено');
  }

  fromRouterDevice(routerDevice: RouterDevice): Device {
    return {
      id: 0,
      name: routerDevice.name || routerDevice.hostname,
      type: DeviceType.Unknown,
      mac: routerDevice.mac,
      address: routerDevice.ip,
      manufacturer: DeviceManufacturer.Unknown,
      matterNodeId: null,
      usedForAtHomeDetection: false,
      createdAt: new Date(Date.now() - routerDevice.uptime),
    };
  }

  async getDevice(deviceId: number): Promise<Device> {
    const device = await prisma.device.findUnique({
      where: {
        id: deviceId,
      },
    });

    if (!device) {
      throw new CustomError(ErrorCode.NOT_FOUND, 'Устройство не найдено');
    }

    return device;
  }

  async getDeviceAddressAndMac(addressAndMac: DeviceAddressAndMac): Promise<DeviceAddressAndMac> {
    const routerDevices = await this.getRouterDevices();
    const routerDevice = routerDevices.find(
      ({ ip, mac }) => mac.toUpperCase() === addressAndMac.mac || ip === addressAndMac.address,
    );

    return {
      address: routerDevice?.ip ?? addressAndMac.address,
      mac: routerDevice?.mac.toUpperCase() ?? addressAndMac.mac,
    };
  }

  async getDevices(): Promise<Device[]> {
    return prisma.device.findMany();
  }

  async getDeviceInfo(deviceId: number, options: GetDeviceInfoOptions = {}): Promise<DeviceInfo> {
    const { timeout = DEFAULT_TIMEOUT } = options;

    const [device, routerDevices] = await Promise.all([
      this.getDevice(deviceId),
      options.routerDevices ?? this.getRouterDevices(),
    ]);
    const routerDevice = await this.getRouterDevice(device, routerDevices);

    const deviceInfo: DeviceInfo = {
      ...device,
      state: {
        online: routerDevice?.online ?? false,
        power: 'unknown',
      },
    };

    await timed({
      time: timeout,
      throwOnTimeout: false,
      task: async (signal) => {
        if (device.matterNodeId) {
          const nodeState = await this.matterClient.getNodeState(BigInt(device.matterNodeId));

          deviceInfo.state.power = nodeState.power;
        } else if (device.type === DeviceType.Lightbulb && device.manufacturer === DeviceManufacturer.Yeelight) {
          const { address: deviceIp } = await this.getDeviceAddressAndMac(device);

          if (isDefined(deviceIp)) {
            const deviceState = await this.yeelightClient.getState(deviceIp, signal);

            if (deviceState.power) {
              deviceInfo.state.power = deviceState.power === 'on';
            }
          }
        }
      },
    });

    return deviceInfo;
  }

  async getOnlineDevicesInfo(): Promise<DeviceInfo[]> {
    const [knownDevices, allRouterDevices] = await Promise.all([this.getDevices(), this.getRouterDevices()]);
    const routerDevices = await Promise.all(
      knownDevices.map((device) => this.getRouterDevice(device, allRouterDevices)),
    );

    return Promise.all(
      knownDevices
        .filter((_device, index) => routerDevices.at(index)?.online)
        .map((device) =>
          this.getDeviceInfo(device.id, {
            routerDevices: allRouterDevices,
          }),
        ),
    );
  }

  async getRouterDevice(device: Device, routerDevices?: RouterDevice[]): Promise<RouterDevice | null> {
    routerDevices ??= await routerClient.getDevices();

    return routerDevices.find(({ ip, mac }) => device.address === ip || device.mac === mac) ?? null;
  }

  async getRouterDevices(): Promise<RouterDevice[]> {
    try {
      return await routerClient.getDevices();
    } catch {
      return [];
    }
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

  async toggleDevicePower(deviceId: number): Promise<void> {
    await timed({
      time: DEFAULT_TIMEOUT,
      task: async (signal) => {
        const device = await this.getDevice(deviceId);

        if (device.matterNodeId) {
          return this.matterClient.toggle(BigInt(device.matterNodeId));
        }

        if (device.type === DeviceType.Lightbulb) {
          if (device.manufacturer === DeviceManufacturer.Yeelight) {
            const { address: deviceIp } = await this.getDeviceAddressAndMac(device);

            if (isDefined(deviceIp)) {
              return this.yeelightClient.toggle(deviceIp, signal);
            }
          }
        }

        throw new CustomError(ErrorCode.UNSUPPORTED, 'Операция не поддерживается');
      },
    });
  }

  async turnOffDevice(deviceId: number): Promise<void> {
    await timed({
      time: DEFAULT_TIMEOUT,
      task: async (signal) => {
        const device = await this.getDevice(deviceId);

        if (device.matterNodeId) {
          return this.matterClient.turnOffNode(BigInt(device.matterNodeId), signal);
        }

        if (device.type === DeviceType.Lightbulb) {
          if (device.manufacturer === DeviceManufacturer.Yeelight) {
            const { address: deviceIp } = await this.getDeviceAddressAndMac(device);

            if (isDefined(deviceIp)) {
              return this.yeelightClient.turnOffDevice(deviceIp, signal);
            }
          }
        }

        throw new CustomError(ErrorCode.UNSUPPORTED, 'Операция не поддерживается');
      },
    });
  }

  async turnOnDevice(deviceId: number): Promise<void> {
    await timed({
      time: DEFAULT_TIMEOUT,
      task: async (signal) => {
        const device = await this.getDevice(deviceId);

        if (device.matterNodeId) {
          return this.matterClient.turnOnNode(BigInt(device.matterNodeId), signal);
        }

        if (device.type === DeviceType.Lightbulb) {
          if (device.manufacturer === DeviceManufacturer.Yeelight) {
            const { address: deviceIp } = await this.getDeviceAddressAndMac(device);

            if (isDefined(deviceIp)) {
              return this.yeelightClient.turnOnDevice(deviceIp, signal);
            }
          }

          throw new CustomError(ErrorCode.UNSUPPORTED, 'Операция не поддерживается');
        }

        await this.wakeDevice(device);
      },
    });
  }

  private async wakeDevice(device: Device): Promise<void> {
    const { address: deviceIp, mac: deviceMac } = await this.getDeviceAddressAndMac(device);

    if (!deviceIp || !deviceMac) {
      throw new CustomError(ErrorCode.UNSUPPORTED, 'Операция не поддерживается');
    }

    await wakeOnLan({
      mac: deviceMac,
      address: deviceIp,
    });
  }
}
