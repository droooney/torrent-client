import { SECOND } from 'constants/date';

import { RouterDevice, RouterProvider } from 'router-client/types';

import EventEmitter from 'utilities/EventEmitter';
import { runTask } from 'utilities/process';
import { delay } from 'utilities/promise';

export type RouterClientOptions = {
  provider: RouterProvider;
};

export type RouterClientEvents = {
  deviceOnline: [device: RouterDevice];
  deviceOffline: [device: RouterDevice];
};

export default class RouterClient extends EventEmitter<RouterClientEvents> {
  private readonly provider: RouterProvider;
  private pollAbortController = new AbortController();

  devices: RouterDevice[] = [];

  constructor(options: RouterClientOptions) {
    super();

    this.provider = options.provider;

    this.start();
  }

  destroy(): void {
    this.pollAbortController.abort(new Error('Client destroyed'));
  }

  private async getDevices(): Promise<RouterDevice[]> {
    return this.provider.getDevices();
  }

  private start(): void {
    runTask(async () => {
      while (!this.pollAbortController.signal.aborted) {
        try {
          const oldDevices = this.devices;

          this.devices = await this.getDevices();

          oldDevices.forEach((device) => {
            if (this.devices.every(({ ip }) => device.ip !== ip)) {
              this.emit('deviceOffline', device);
            }
          });

          this.devices.forEach((device) => {
            if (oldDevices.every(({ ip }) => device.ip !== ip)) {
              this.emit('deviceOnline', device);
            }
          });
        } catch {
          /* empty */
        }

        await delay(SECOND);
      }
    });
  }
}
