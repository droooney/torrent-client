import { z } from 'zod';

export enum SystemCallbackButtonSource {
  REFRESH_STATUS = 's0',
}

export const refreshStatusCallbackDataSchema = z.object({
  $: z.literal(SystemCallbackButtonSource.REFRESH_STATUS),
});

// export const systemCallbackDataSchema = z.union([
//   refreshStatusCallbackDataSchema,
// ]);

export const systemCallbackDataSchema = refreshStatusCallbackDataSchema;

export interface RefreshStatusCallbackData {
  source: z.infer<typeof refreshStatusCallbackDataSchema>['$'];
}

export type SystemBeautifiedCallbackData = RefreshStatusCallbackData;
