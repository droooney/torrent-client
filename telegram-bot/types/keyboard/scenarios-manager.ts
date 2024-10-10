import { z } from 'zod';

// next number is 13
export enum ScenariosManagerCallbackButtonType {
  // Status
  OpenStatus = 'sc4',
  RefreshStatus = 'sc5',

  // Scenarios list
  OpenScenariosList = 'sc0',
  ScenariosListPage = 'sc1',
  RefreshScenariosList = 'sc2',

  // Add scenario
  AddScenario = 'sc6',

  // Scenario
  OpenScenario = 'sc3',
  RefreshSScenario = 'sc10',
  ScenarioSetActive = 'sc9',
  ScenarioDelete = 'sc7',
  ScenarioDeleteConfirm = 'sc8',

  // Edit scenario
  EditScenario = 'sc11',
  EditScenarioName = 'sc12',
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
  }),

  z.object({
    type: z.literal(ScenariosManagerCallbackButtonType.ScenariosListPage),
    page: z.number(),
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
  }),

  z.object({
    type: z.literal(ScenariosManagerCallbackButtonType.RefreshSScenario),
    scenarioId: z.number(),
  }),

  z.object({
    type: z.literal(ScenariosManagerCallbackButtonType.ScenarioSetActive),
    scenarioId: z.number(),
    isActive: z.boolean(),
  }),

  z.object({
    type: z.literal(ScenariosManagerCallbackButtonType.ScenarioDelete),
    scenarioId: z.number(),
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
]);
