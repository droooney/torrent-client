import { z } from 'zod';

import { scenarioStepTypeSchema } from 'scenarios-manager/types/scenario';

// next number is 26
export enum ScenariosManagerCallbackButtonType {
  // Status
  OpenStatus = 'sc4',
  RefreshStatus = 'sc5',

  // Scenarios list
  OpenScenariosList = 'sc0',
  RefreshScenariosList = 'sc2',

  // Add scenario
  AddScenario = 'sc6',

  // Scenario
  OpenScenario = 'sc3',
  RefreshScenario = 'sc10',
  RunScenario = 'sc25',
  ScenarioSetActive = 'sc9',
  ScenarioDeleteConfirm = 'sc8',

  // Edit scenario
  EditScenario = 'sc11',
  EditScenarioName = 'sc12',

  // Scenario steps
  OpenScenarioSteps = 'sc13',
  RefreshScenarioSteps = 'sc14',

  // Add scenario step
  AddScenarioStepSetName = 'sc16',
  AddScenarioStepSetType = 'sc17',
  AddScenarioStepType = 'sc18',
  AddScenarioStepScenariosList = 'sc19',
  AddScenarioStepScenario = 'sc20',
  AddScenarioStepDevicesList = 'sc21',
  AddScenarioStepDevice = 'sc22',

  // Scenario step
  OpenScenarioStep = 'sc15',
  ScenarioStepSetActive = 'sc23',
  ScenarioStepDeleteConfirm = 'sc24',
}

export const scenariosManagerCallbackDataSchema = z.union([
  z.object({
    type: z.literal(ScenariosManagerCallbackButtonType.OpenStatus),
  }),

  z.object({
    type: z.literal(ScenariosManagerCallbackButtonType.RefreshStatus),
  }),

  z.object({
    type: z.literal(ScenariosManagerCallbackButtonType.OpenScenariosList),
    page: z.optional(z.number()),
  }),

  z.object({
    type: z.literal(ScenariosManagerCallbackButtonType.RefreshScenariosList),
    page: z.number(),
  }),

  z.object({
    type: z.literal(ScenariosManagerCallbackButtonType.AddScenario),
  }),

  z.object({
    type: z.literal(ScenariosManagerCallbackButtonType.OpenScenario),
    scenarioId: z.number(),
    withDeleteConfirm: z.optional(z.boolean()),
  }),

  z.object({
    type: z.literal(ScenariosManagerCallbackButtonType.RefreshScenario),
    scenarioId: z.number(),
  }),

  z.object({
    type: z.literal(ScenariosManagerCallbackButtonType.RunScenario),
    scenarioId: z.number(),
  }),

  z.object({
    type: z.literal(ScenariosManagerCallbackButtonType.ScenarioSetActive),
    scenarioId: z.number(),
    isActive: z.boolean(),
  }),

  z.object({
    type: z.literal(ScenariosManagerCallbackButtonType.ScenarioDeleteConfirm),
    scenarioId: z.number(),
  }),

  z.object({
    type: z.literal(ScenariosManagerCallbackButtonType.EditScenario),
    scenarioId: z.number(),
  }),

  z.object({
    type: z.literal(ScenariosManagerCallbackButtonType.EditScenarioName),
    scenarioId: z.number(),
  }),

  z.object({
    type: z.literal(ScenariosManagerCallbackButtonType.OpenScenarioSteps),
    scenarioId: z.number(),
    page: z.optional(z.number()),
  }),

  z.object({
    type: z.literal(ScenariosManagerCallbackButtonType.RefreshScenarioSteps),
    scenarioId: z.number(),
    page: z.number(),
  }),

  z.object({
    type: z.literal(ScenariosManagerCallbackButtonType.AddScenarioStepSetName),
    scenarioId: z.number(),
    isBack: z.optional(z.boolean()),
  }),

  z.object({
    type: z.literal(ScenariosManagerCallbackButtonType.AddScenarioStepSetType),
  }),

  z.object({
    type: z.literal(ScenariosManagerCallbackButtonType.AddScenarioStepType),
    stepType: scenarioStepTypeSchema,
  }),

  z.object({
    type: z.literal(ScenariosManagerCallbackButtonType.AddScenarioStepScenariosList),
    page: z.optional(z.number()),
    isRefresh: z.optional(z.boolean()),
  }),

  z.object({
    type: z.literal(ScenariosManagerCallbackButtonType.AddScenarioStepScenario),
    scenarioId: z.number(),
  }),

  z.object({
    type: z.literal(ScenariosManagerCallbackButtonType.AddScenarioStepDevicesList),
    page: z.optional(z.number()),
    isRefresh: z.optional(z.boolean()),
  }),

  z.object({
    type: z.literal(ScenariosManagerCallbackButtonType.AddScenarioStepDevice),
    deviceId: z.number(),
  }),

  z.object({
    type: z.literal(ScenariosManagerCallbackButtonType.OpenScenarioStep),
    stepId: z.number(),
    withDeleteConfirm: z.optional(z.boolean()),
    isRefresh: z.optional(z.boolean()),
  }),

  z.object({
    type: z.literal(ScenariosManagerCallbackButtonType.ScenarioStepSetActive),
    stepId: z.number(),
    isActive: z.boolean(),
  }),

  z.object({
    type: z.literal(ScenariosManagerCallbackButtonType.ScenarioStepDeleteConfirm),
    stepId: z.number(),
  }),
]);
