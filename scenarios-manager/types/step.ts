import { ScenarioStepType } from '@prisma/client';
import { z } from 'zod';

export const scenarioStepTypeSchema = z.nativeEnum(ScenarioStepType);

export const runScenarioStepRunParamsSchema = z.object({
  type: z.literal(ScenarioStepType.RunScenario),
  scenarioId: z.number(),
});

export const waitPeriodStepRunParamsSchema = z.object({
  type: z.literal(ScenarioStepType.Wait),
  period: z.number(),
});

export const turnOnDeviceStepRunParamsSchema = z.object({
  type: z.literal(ScenarioStepType.TurnOnDevice),
  deviceId: z.number(),
});

export const turnOffDeviceStepRunParamsSchema = z.object({
  type: z.literal(ScenarioStepType.TurnOffDevice),
  deviceId: z.number(),
});

export const stepRunParamsSchema = z.union([
  runScenarioStepRunParamsSchema,
  waitPeriodStepRunParamsSchema,
  turnOnDeviceStepRunParamsSchema,
  turnOffDeviceStepRunParamsSchema,
]);

export type StepRunParams = z.TypeOf<typeof stepRunParamsSchema>;

export const addScenarioStepPayloadSchema = z.object({
  scenarioId: z.number(),
  name: z.string(),
  runParams: stepRunParamsSchema,
});

export type AddScenarioStepPayload = z.TypeOf<typeof addScenarioStepPayloadSchema>;

export type AddScenarioStepPayloadField = Exclude<keyof AddScenarioStepPayload, 'scenarioId' | 'runParams'>;
