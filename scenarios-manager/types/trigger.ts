import { ScenarioTriggerType } from '@prisma/client';
import { z } from 'zod';

export const scenarioTriggerTypeSchema = z.nativeEnum(ScenarioTriggerType);

export const scheduleTriggerParamsSchema = z.object({
  type: z.literal(ScenarioTriggerType.Schedule),
  schedule: z.string(),
});

export const emptyHomeTriggerParamsSchema = z.object({
  type: z.literal(ScenarioTriggerType.EmptyHome),
});

export const nonEmptyHomeTriggerParamsSchema = z.object({
  type: z.literal(ScenarioTriggerType.NonEmptyHome),
});

export const deviceOnlineTriggerParamsSchema = z.object({
  type: z.literal(ScenarioTriggerType.DeviceOnline),
  deviceId: z.number(),
});

export const deviceOfflineTriggerParamsSchema = z.object({
  type: z.literal(ScenarioTriggerType.DeviceOffline),
  deviceId: z.number(),
});

export const devicePowerOnTriggerParamsSchema = z.object({
  type: z.literal(ScenarioTriggerType.DevicePowerOn),
  deviceId: z.number(),
});

export const devicePowerOffTriggerParamsSchema = z.object({
  type: z.literal(ScenarioTriggerType.DevicePowerOff),
  deviceId: z.number(),
});

export const aliceCommandTriggerParamsSchema = z.object({
  type: z.literal(ScenarioTriggerType.AliceCommand),
  command: z.string(),
});

export const telegramCommandTriggerParamsSchema = z.object({
  type: z.literal(ScenarioTriggerType.TelegramCommand),
  command: z.string(),
  userId: z.number(),
});

export const triggerParamsSchema = z.union([
  scheduleTriggerParamsSchema,
  emptyHomeTriggerParamsSchema,
  nonEmptyHomeTriggerParamsSchema,
  deviceOnlineTriggerParamsSchema,
  deviceOfflineTriggerParamsSchema,
  devicePowerOnTriggerParamsSchema,
  devicePowerOffTriggerParamsSchema,
  aliceCommandTriggerParamsSchema,
  telegramCommandTriggerParamsSchema,
]);

export type TriggerParams = z.TypeOf<typeof triggerParamsSchema>;

export const addScenarioTriggerPayloadSchema = z.object({
  scenarioId: z.number(),
  name: z.string(),
  params: triggerParamsSchema,
});

export type AddScenarioTriggerPayload = z.TypeOf<typeof addScenarioTriggerPayloadSchema>;

export type AddScenarioTriggerPayloadField = Exclude<keyof AddScenarioTriggerPayload, 'scenarioId' | 'params'>;
