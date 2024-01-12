import { z } from 'zod';

export enum RootCallbackButtonSource {
  BACK_TO_ROOT = 'r0',
  OPEN_SYSTEM = 'r1',
  OPEN_DEVICES = 'r3',
  OPEN_TORRENT_CLIENT = 'r2',
}

export const rootCallbackDataSchema = z.union([
  z.object({
    $: z.literal(RootCallbackButtonSource.BACK_TO_ROOT),
  }),

  z.object({
    $: z.literal(RootCallbackButtonSource.OPEN_SYSTEM),
  }),

  z.object({
    $: z.literal(RootCallbackButtonSource.OPEN_DEVICES),
  }),

  z.object({
    $: z.literal(RootCallbackButtonSource.OPEN_TORRENT_CLIENT),
  }),
]);

export type RootBeautifiedCallbackData =
  | {
      source: RootCallbackButtonSource.BACK_TO_ROOT;
    }
  | {
      source: RootCallbackButtonSource.OPEN_SYSTEM;
    }
  | {
      source: RootCallbackButtonSource.OPEN_DEVICES;
    }
  | {
      source: RootCallbackButtonSource.OPEN_TORRENT_CLIENT;
    };
