import { z } from 'zod';

// next number is 3
export enum SystemCallbackButtonType {
  OpenStatus = 's2',
  RefreshStatus = 's0',
  Restart = 's1',
}

export const systemCallbackDataSchema = z.union([
  z.object({
    type: z.literal(SystemCallbackButtonType.OpenStatus),
  }),

  z.object({
    type: z.literal(SystemCallbackButtonType.RefreshStatus),
  }),

  z.object({
    type: z.literal(SystemCallbackButtonType.Restart),
  }),
]);
