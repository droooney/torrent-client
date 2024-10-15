import { z } from 'zod';

// next number is 3
export enum SystemCallbackButtonType {
  OpenStatus = 's2',
  Restart = 's1',
}

export const systemCallbackDataSchema = z.union([
  z.object({
    type: z.literal(SystemCallbackButtonType.OpenStatus),
    isRefresh: z.optional(z.boolean()),
  }),

  z.object({
    type: z.literal(SystemCallbackButtonType.Restart),
  }),
]);
