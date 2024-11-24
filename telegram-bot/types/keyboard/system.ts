import { z } from 'zod';

// next number is 4
export enum SystemCallbackButtonType {
  OpenStatus = 's2',
  RestartProcess = 's3',
  RestartSystem = 's1',
}

export const systemCallbackDataSchema = z.union([
  z.object({
    type: z.literal(SystemCallbackButtonType.OpenStatus),
    isRefresh: z.optional(z.boolean()),
    withSystemRestartConfirm: z.optional(z.boolean()),
    withProcessRestartConfirm: z.optional(z.boolean()),
  }),

  z.object({
    type: z.literal(SystemCallbackButtonType.RestartProcess),
  }),

  z.object({
    type: z.literal(SystemCallbackButtonType.RestartSystem),
  }),
]);
