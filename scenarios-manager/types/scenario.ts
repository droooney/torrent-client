import { ScenarioStepType } from '@prisma/client';
import { z } from 'zod';

import { runStepParamsSchema } from 'scenarios-manager/types/step';

export const scenarioStepTypeSchema = z.nativeEnum(ScenarioStepType);

export const editScenarioPayloadSchema = z.object({
  scenarioId: z.number(),
});

export type EditScenarioPayload = z.TypeOf<typeof editScenarioPayloadSchema>;

export const addScenarioStepPayloadSchema = z.object({
  scenarioId: z.number(),
  name: z.string(),
  runParams: runStepParamsSchema,
});

export type AddScenarioStepPayload = z.TypeOf<typeof addScenarioStepPayloadSchema>;

export type AddScenarioStepPayloadField = Exclude<keyof AddScenarioStepPayload, 'scenarioId' | 'runParams'>;
