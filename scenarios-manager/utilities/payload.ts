import { ScenarioStep, ScenarioTrigger } from '@prisma/client';

import { EditScenarioPayload, editScenarioPayloadSchema } from 'scenarios-manager/types/scenario';
import {
  AddScenarioStepPayload,
  StepRunParams,
  addScenarioStepPayloadSchema,
  stepRunParamsSchema,
} from 'scenarios-manager/types/step';
import {
  AddScenarioTriggerPayload,
  TriggerParams,
  addScenarioTriggerPayloadSchema,
  triggerParamsSchema,
} from 'scenarios-manager/types/trigger';

import ScenariosManager from 'scenarios-manager/utilities/ScenariosManager';

export function getAddStepPayload(payload: unknown): AddScenarioStepPayload {
  const parsedPayload = addScenarioStepPayloadSchema.safeParse(payload);

  return parsedPayload.success ? parsedPayload.data : ScenariosManager.defaultAddScenarioStepPayload;
}

export function getAddTriggerPayload(payload: unknown): AddScenarioTriggerPayload {
  const parsedPayload = addScenarioTriggerPayloadSchema.safeParse(payload);

  return parsedPayload.success ? parsedPayload.data : ScenariosManager.defaultAddScenarioTriggerPayload;
}

export function getEditScenarioPayload(payload: unknown): EditScenarioPayload | null {
  const parsedPayload = editScenarioPayloadSchema.safeParse(payload);

  return parsedPayload.success ? parsedPayload.data : null;
}

export function getStepRunParams(scenarioStep: ScenarioStep): StepRunParams | null {
  const parsedPayload = stepRunParamsSchema.safeParse({
    type: scenarioStep.type,
    ...(typeof scenarioStep.payload === 'object' ? scenarioStep.payload : null),
  });

  return parsedPayload.success ? parsedPayload.data : null;
}

export function getTriggerParams(scenarioTrigger: ScenarioTrigger): TriggerParams | null {
  const parsedPayload = triggerParamsSchema.safeParse({
    type: scenarioTrigger.type,
    ...(typeof scenarioTrigger.payload === 'object' ? scenarioTrigger.payload : null),
  });

  return parsedPayload.success ? parsedPayload.data : null;
}
