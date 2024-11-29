import { Scenario, ScenarioStep, ScenarioStepType } from '@prisma/client';
import { InlineKeyboard, Markdown } from '@tg-sensei/bot';

import { AddScenarioStepPayload, AddScenarioStepPayloadField } from 'scenarios-manager/types/step';
import { ScenariosManagerCallbackButtonType } from 'telegram-bot/types/keyboard/scenarios-manager';

import { backToCallbackButton } from 'telegram-bot/utilities/keyboard';

import { callbackDataProvider } from 'telegram-bot/bot';

const SCENARIO_TYPE_ICON_MAP: Record<ScenarioStepType, string> = {
  [ScenarioStepType.RunScenario]: '📋',
  [ScenarioStepType.Wait]: '⏳',
  [ScenarioStepType.TurnOnDevice]: '🟢',
  [ScenarioStepType.TurnOffDevice]: '🔴',
  [ScenarioStepType.ToggleDevice]: '🟡',
};

const SCENARIO_TYPE_NAME_MAP: Record<ScenarioStepType, string> = {
  [ScenarioStepType.RunScenario]: 'Запуск сценария',
  [ScenarioStepType.Wait]: 'Ожидание',
  [ScenarioStepType.TurnOnDevice]: 'Включение устройства',
  [ScenarioStepType.TurnOffDevice]: 'Выключение устройства',
  [ScenarioStepType.ToggleDevice]: 'Переключение устройства',
};

const ADD_SCENARIO_STEP_FIELDS_INFO: Record<AddScenarioStepPayloadField, { icon: string; name: string }> = {
  name: {
    icon: '🅰️',
    name: 'Название',
  },
};

export function getScenarioStepTypeIcon(scenarioStepType: ScenarioStepType): string {
  return SCENARIO_TYPE_ICON_MAP[scenarioStepType];
}

export function getScenarioStepTypeString(scenarioStepType: ScenarioStepType): string {
  return SCENARIO_TYPE_NAME_MAP[scenarioStepType];
}

export type FormatScenarioOptions = {
  indexString?: string;
};

export function formatScenario(scenario: Scenario, options: FormatScenarioOptions = {}): Markdown {
  const { indexString } = options;

  return Markdown.create`🅰️ ${Markdown.bold('Название')}: ${indexString && Markdown.create`${indexString} `}${
    scenario.name
  }
${scenario.isActive ? '🟢' : '🔴'} ${Markdown.bold('Статус:')} ${scenario.isActive ? 'Активен' : 'Не активен'}`;
}

export function formatScenarioStepField<Field extends AddScenarioStepPayloadField>(
  field: Field,
  value: AddScenarioStepPayload[Field],
): Markdown {
  const { icon, name } = ADD_SCENARIO_STEP_FIELDS_INFO[field];

  return Markdown.create`${icon} ${Markdown.bold(name)}: ${value}`;
}

export function formatScenarioStepFields<Field extends AddScenarioStepPayloadField>(
  data: Pick<AddScenarioStepPayload, Field>,
  fields: Field[],
): Markdown {
  return Markdown.join(
    fields.map((field) => {
      return formatScenarioStepField(field, data[field]);
    }),
    '\n',
  );
}

export function formatScenarioStepEnteredFields(
  addScenarioStepPayload: AddScenarioStepPayload,
  fields: [AddScenarioStepPayloadField, ...AddScenarioStepPayloadField[]],
): Markdown {
  return Markdown.create`${Markdown.bold('Введенные данные')}:
${formatScenarioStepFields(addScenarioStepPayload, fields)}`;
}

export type FormatScenarioStepOptions = {
  indexString?: string;
};

export function formatScenarioStep(scenarioStep: ScenarioStep, options: FormatScenarioStepOptions = {}): Markdown {
  const { indexString } = options;

  // TODO: show scenario step content (type + payload)

  return Markdown.create`🅰️ ${Markdown.bold('Название')}: ${indexString && Markdown.create`${indexString} `}${
    scenarioStep.name
  }
${scenarioStep.isActive ? '🟢' : '🔴'} ${Markdown.bold('Статус:')} ${scenarioStep.isActive ? 'Активен' : 'Не активен'}`;
}

export async function getBackToEditScenarioKeyboard(scenarioId: number): Promise<InlineKeyboard> {
  return callbackDataProvider.buildInlineKeyboard([
    [
      backToCallbackButton('К редактированию', {
        type: ScenariosManagerCallbackButtonType.EditScenario,
        scenarioId,
      }),
    ],
    [
      backToCallbackButton('К устройству', {
        type: ScenariosManagerCallbackButtonType.OpenScenario,
        scenarioId,
      }),
      backToCallbackButton('К списку', {
        type: ScenariosManagerCallbackButtonType.OpenScenariosList,
      }),
    ],
  ]);
}
