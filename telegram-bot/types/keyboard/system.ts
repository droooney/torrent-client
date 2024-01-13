import { z } from 'zod';

export enum SystemCallbackButtonSource {
  REFRESH_STATUS = 's0',
  RESTART = 's1',
}

export const systemCallbackDataSchema = z.union([
  z.object({
    $: z.literal(SystemCallbackButtonSource.REFRESH_STATUS),
  }),

  z.object({
    $: z.literal(SystemCallbackButtonSource.RESTART),
  }),
]);

export type SystemBeautifiedCallbackData =
  | {
      source: SystemCallbackButtonSource.REFRESH_STATUS;
    }
  | {
      source: SystemCallbackButtonSource.RESTART;
    };
