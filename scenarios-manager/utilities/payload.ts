import { ScenarioCondition, ScenarioStep, ScenarioStepCondition, ScenarioTrigger } from '@prisma/client';

import { ConditionParams, conditionParamsSchema } from 'scenarios-manager/types/condition';
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

export function getConditionParams(condition: ScenarioCondition | ScenarioStepCondition): ConditionParams | null {
  const parsedPayload = conditionParamsSchema.safeParse({
    type: condition.type,
    ...(typeof condition.payload === 'object' ? condition.payload : null),
  });

  return parsedPayload.success ? parsedPayload.data : null;
}
