import { z } from 'zod';

export enum SystemCallbackButtonType {
  RefreshStatus = 's0',
  Restart = 's1',
}

export const systemCallbackDataSchema = z.union([
  z.object({
    type: z.literal(SystemCallbackButtonType.RefreshStatus),
  }),

  z.object({
    type: z.literal(SystemCallbackButtonType.Restart),
  }),
]);
