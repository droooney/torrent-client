import { z } from 'zod';

// next number is 4
export enum RootCallbackButtonType {
  OpenRoot = 'r0',
}

export const rootCallbackDataSchema = z.object({
  type: z.literal(RootCallbackButtonType.OpenRoot),
});
