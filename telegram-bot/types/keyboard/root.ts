import { z } from 'zod';

export enum RootCallbackButtonType {
  BackToRoot = 'r0',
  OpenSystem = 'r1',
  OpenDevices = 'r3',
  OpenTorrentClient = 'r2',
}

export const rootCallbackDataSchema = z.union([
  z.object({
    type: z.literal(RootCallbackButtonType.BackToRoot),
  }),

  z.object({
    type: z.literal(RootCallbackButtonType.OpenSystem),
  }),

  z.object({
    type: z.literal(RootCallbackButtonType.OpenDevices),
  }),

  z.object({
    type: z.literal(RootCallbackButtonType.OpenTorrentClient),
  }),
]);
