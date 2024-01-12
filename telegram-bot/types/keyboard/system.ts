import { z } from 'zod';

export enum SystemCallbackButtonSource {
  REFRESH_STATUS = 's0',
}

// export const systemCallbackDataSchema = z.union([
//   z.object({
//     $: z.literal(SystemCallbackButtonSource.REFRESH_STATUS),
//   }),
// ]);

export const systemCallbackDataSchema = z.object({
  $: z.literal(SystemCallbackButtonSource.REFRESH_STATUS),
});

export type SystemBeautifiedCallbackData = {
  source: SystemCallbackButtonSource.REFRESH_STATUS;
};
