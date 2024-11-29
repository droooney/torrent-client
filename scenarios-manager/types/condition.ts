import { ScenarioConditionType } from '@prisma/client';
import { z } from 'zod';

export const scenarioConditionTypeSchema = z.nativeEnum(ScenarioConditionType);

export const timeConditionParamsSchema = z.object({
  type: z.literal(ScenarioConditionType.Time),
  timeOfDay: z.array(
    z.object({
      start: z.number(),
      end: z.number(),
    }),
  ),
});

export const emptyHomeConditionParamsSchema = z.object({
  type: z.literal(ScenarioConditionType.EmptyHome),
});

export const nonEmptyHomeConditionParamsSchema = z.object({
  type: z.literal(ScenarioConditionType.NonEmptyHome),
});

export const deviceOnlineConditionParamsSchema = z.object({
  type: z.literal(ScenarioConditionType.DeviceOnline),
  deviceId: z.number(),
});

export const deviceOfflineConditionParamsSchema = z.object({
  type: z.literal(ScenarioConditionType.DeviceOffline),
  deviceId: z.number(),
});

export const devicePowerOnConditionParamsSchema = z.object({
  type: z.literal(ScenarioConditionType.DevicePowerOn),
  deviceId: z.number(),
});

export const devicePowerOffConditionParamsSchema = z.object({
  type: z.literal(ScenarioConditionType.DevicePowerOff),
  deviceId: z.number(),
});

export const conditionParamsSchema = z.union([
  timeConditionParamsSchema,
  emptyHomeConditionParamsSchema,
  nonEmptyHomeConditionParamsSchema,
  deviceOnlineConditionParamsSchema,
  deviceOfflineConditionParamsSchema,
  devicePowerOnConditionParamsSchema,
  devicePowerOffConditionParamsSchema,
]);

export type ConditionParams = z.TypeOf<typeof conditionParamsSchema>;

export const addScenarioConditionPayloadSchema = z.object({
  scenarioId: z.number(),
  name: z.string(),
  params: conditionParamsSchema,
});

export type AddScenarioConditionPayload = z.TypeOf<typeof addScenarioConditionPayloadSchema>;

export type AddScenarioConditionPayloadField = Exclude<keyof AddScenarioConditionPayload, 'scenarioId' | 'params'>;
