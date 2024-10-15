import { ScenarioStepType } from '@prisma/client';
import { z } from 'zod';

export const runScenarioRunStepParamsSchema = z.object({
  type: z.literal(ScenarioStepType.RunScenario),
  scenarioId: z.number(),
});

export const waitPeriodRunStepParamsSchema = z.object({
  type: z.literal(ScenarioStepType.Wait),
  period: z.number(),
});

export const turnOnDeviceRunStepParamsSchema = z.object({
  type: z.literal(ScenarioStepType.TurnOnDevice),
  deviceId: z.number(),
});

export const turnOffDeviceRunStepParamsSchema = z.object({
  type: z.literal(ScenarioStepType.TurnOffDevice),
  deviceId: z.number(),
});

export const runStepParamsSchema = z.union([
  runScenarioRunStepParamsSchema,
  waitPeriodRunStepParamsSchema,
  turnOnDeviceRunStepParamsSchema,
  turnOffDeviceRunStepParamsSchema,
]);

export type RunStepParams = z.TypeOf<typeof runStepParamsSchema>;
