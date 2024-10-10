import { z } from 'zod';

export const editScenarioPayloadSchema = z.object({
  scenarioId: z.number(),
});

export type EditScenarioPayload = z.TypeOf<typeof editScenarioPayloadSchema>;
