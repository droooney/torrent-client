import { ScenarioStep } from '@prisma/client';

import {
  AddScenarioStepPayload,
  EditScenarioPayload,
  addScenarioStepPayloadSchema,
  editScenarioPayloadSchema,
} from 'scenarios-manager/types/scenario';
import { RunStepParams, runStepParamsSchema } from 'scenarios-manager/types/step';

import ScenariosManager from 'scenarios-manager/utilities/ScenariosManager';

export function getAddStepPayload(payload: unknown): AddScenarioStepPayload {
  const parsedPayload = addScenarioStepPayloadSchema.safeParse(payload);

  return parsedPayload.success ? parsedPayload.data : ScenariosManager.defaultAddScenarioStepPayload;
}

export function getEditScenarioPayload(payload: unknown): EditScenarioPayload | null {
  const parsedPayload = editScenarioPayloadSchema.safeParse(payload);

  return parsedPayload.success ? parsedPayload.data : null;
}

export function getStepRunParams(scenarioStep: ScenarioStep): RunStepParams | null {
  const parsedPayload = runStepParamsSchema.safeParse({
    type: scenarioStep.type,
    ...(typeof scenarioStep.payload === 'object' ? scenarioStep.payload : null),
  });

  return parsedPayload.success ? parsedPayload.data : null;
}
