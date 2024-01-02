import { z } from 'zod';

export const binarySchema = z.union([z.literal(0), z.literal(1)]);
