import { RouterDevice, RouterProvider } from 'router-client/types';

export type RouterClientOptions = {
  provider: RouterProvider;
};

export default class RouterClient {
  readonly provider: RouterProvider;

  constructor(options: RouterClientOptions) {
    this.provider = options.provider;
  }

  async getDevices(): Promise<RouterDevice[]> {
    return this.provider.getDevices();
  }
}
