import { CommandLibrary, Device, DeviceState, Yeelight } from 'yeelight-control';

type StateChangedEvent = {
  device: Device;
  state: DeviceState;
};

type ExecuteCommandOptions = {
  deviceIp: string;
  signal: AbortSignal;
  command: (device: Device) => unknown;
};

export default class YeelightClient {
  private _stateChangePromiseWithResolvers?: PromiseWithResolvers<StateChangedEvent>;
  private devices = new Map<string, Device>();

  readonly yeelight: Yeelight;

  constructor() {
    this.yeelight = new Yeelight();
  }

  async executeCommand(options: ExecuteCommandOptions): Promise<DeviceState> {
    const { deviceIp, signal, command } = options;
    const device = this.getDevice(deviceIp);

    device.connect();

    command(device);

    const state = await (async () => {
      while (true) {
        signal?.throwIfAborted();

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
    })();

    device.disconnect();

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

  async getState(deviceIp: string, signal: AbortSignal): Promise<DeviceState> {
    return this.executeCommand({
      deviceIp,
      signal,
      command: (device) => device.requestState(),
    });
  }

  removeDevice(deviceIp: string): void {
    this.devices.delete(deviceIp);
  }

  async toggle(deviceIp: string, signal: AbortSignal): Promise<void> {
    await this.executeCommand({
      deviceIp,
      signal,
      command: (device) => device.command(CommandLibrary.toggle),
    });
  }

  async turnOffDevice(deviceIp: string, signal: AbortSignal): Promise<void> {
    await this.executeCommand({
      deviceIp,
      signal,
      command: (device) => device.command(CommandLibrary.powerOff),
    });
  }

  async turnOnDevice(deviceIp: string, signal: AbortSignal): Promise<void> {
    await this.executeCommand({
      deviceIp,
      signal,
      command: (device) => device.command(CommandLibrary.powerOn()),
    });
  }
}
