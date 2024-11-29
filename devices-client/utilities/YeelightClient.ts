import { CommandLibrary, Device, DeviceState, Yeelight } from 'yeelight-control';

import { SECOND } from 'constants/date';

import CustomError, { ErrorCode } from 'utilities/CustomError';
import { timed } from 'utilities/promise';

export type YeelightClientOptions = {
  timeout?: number;
};

type StateChangedEvent = {
  device: Device;
  state: DeviceState;
};

type ExecuteCommandOptions = {
  deviceIp: string;
  timeout?: number;
  throwOnTimeout?: boolean;
  command: (device: Device) => unknown;
};

const DEFAULT_TIMEOUT = 5 * SECOND;

export default class YeelightClient {
  private _stateChangePromiseWithResolvers?: PromiseWithResolvers<StateChangedEvent>;
  private devices = new Map<string, Device>();

  readonly yeelight: Yeelight;
  readonly timeout: number;

  constructor(options: YeelightClientOptions = {}) {
    this.yeelight = new Yeelight();
    this.timeout = options.timeout ?? DEFAULT_TIMEOUT;
  }

  async executeCommand(options: ExecuteCommandOptions): Promise<DeviceState | null> {
    const { deviceIp, timeout = this.timeout, throwOnTimeout, command } = options;
    const device = this.getDevice(deviceIp);

    device.connect();

    command(device);

    const state = await timed(timeout, async (timeoutInfo) => {
      while (!timeoutInfo.timedOut) {
        const newPromise = Promise.withResolvers<StateChangedEvent>();
        const currentPromise = this._stateChangePromiseWithResolvers;
        const { promise } = (this._stateChangePromiseWithResolvers = currentPromise
          ? {
              ...currentPromise,
              promise: currentPromise.promise.then(
                (value) => {
                  newPromise.resolve(value);

                  return value;
                },
                (err) => {
                  newPromise.reject(err);

                  throw err;
                },
              ),
            }
          : newPromise);

        const { device: changedDevice, state } = await promise;

        if (changedDevice === device) {
          return state;
        }
      }

      return null;
    });

    device.disconnect();

    if (throwOnTimeout && !state) {
      throw new CustomError(ErrorCode.TIMEOUT, 'Долгое ожидание ответа от лампочки');
    }

    return state;
  }

  getDevice(deviceIp: string): Device {
    let device = this.devices.get(deviceIp);

    if (device) {
      return device;
    }

    device = this.yeelight.connectOne(deviceIp);

    device.on('update', (state) => {
      const currentPromise = this._stateChangePromiseWithResolvers;

      currentPromise?.resolve({
        device,
        state,
      });

      if (this._stateChangePromiseWithResolvers === currentPromise) {
        this._stateChangePromiseWithResolvers = undefined;
      }
    });

    return device;
  }

  async getState(deviceIp: string, timeout?: number): Promise<DeviceState | null> {
    return this.executeCommand({
      deviceIp,
      timeout,
      throwOnTimeout: false,
      command: (device) => device.requestState(),
    });
  }

  removeDevice(deviceIp: string): void {
    this.devices.delete(deviceIp);
  }

  async toggle(deviceIp: string): Promise<void> {
    await this.executeCommand({
      deviceIp,
      command: (device) => device.command(CommandLibrary.toggle),
    });
  }

  async turnOffDevice(deviceIp: string): Promise<void> {
    await this.executeCommand({
      deviceIp,
      command: (device) => device.command(CommandLibrary.powerOff),
    });
  }

  async turnOnDevice(deviceIp: string): Promise<void> {
    await this.executeCommand({
      deviceIp,
      command: (device) => device.command(CommandLibrary.powerOn()),
    });
  }
}
