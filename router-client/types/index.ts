import { MaybePromise } from 'types/common';

export type RouterProvider = {
  getDevices: () => MaybePromise<RouterDevice[]>;
};

export type RouterDevice = {
  hostname: string;
  name: string;
  ip: string;
  mac: string;
};
