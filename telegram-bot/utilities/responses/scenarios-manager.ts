import { Scenario, ScenarioStep, ScenarioStepType, ScenarioTrigger, ScenarioTriggerType } from '@prisma/client';
import { InlineKeyboard, Markdown } from '@tg-sensei/bot';

import { AddScenarioStepPayload, AddScenarioStepPayloadField } from 'scenarios-manager/types/step';
import { AddScenarioTriggerPayload, AddScenarioTriggerPayloadField } from 'scenarios-manager/types/trigger';
import { InlineKeyboardButtons } from 'telegram-bot/types/keyboard';
import { ScenariosManagerCallbackButtonType } from 'telegram-bot/types/keyboard/scenarios-manager';

import { backToCallbackButton } from 'telegram-bot/utilities/keyboard';

import { callbackDataProvider } from 'telegram-bot/bot';

const SCENARIO_STEP_TYPE_ICON_MAP: Record<ScenarioStepType, string> = {
  [ScenarioStepType.RunScenario]: '📋',
  [ScenarioStepType.Wait]: '⏳',
  [ScenarioStepType.TurnOnDevice]: '🟢',
  [ScenarioStepType.TurnOffDevice]: '🔴',
  [ScenarioStepType.ToggleDevice]: '🟡',
};

const SCENARIO_STEP_TYPE_NAME_MAP: Record<ScenarioStepType, string> = {
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

const SCENARIO_TRIGGER_TYPE_ICON_MAP: Record<ScenarioTriggerType, string> = {
  [ScenarioTriggerType.Schedule]: '📅',
  [ScenarioTriggerType.EmptyHome]: '🏠',
  [ScenarioTriggerType.NonEmptyHome]: '🏘',
  [ScenarioTriggerType.DeviceOnline]: '🌐',
  [ScenarioTriggerType.DeviceOffline]: '🚫',
  [ScenarioTriggerType.DevicePowerOn]: '🟢',
  [ScenarioTriggerType.DevicePowerOff]: '🔴',
  [ScenarioTriggerType.TelegramCommand]: '🖍',
};

const SCENARIO_TRIGGER_TYPE_NAME_MAP: Record<ScenarioTriggerType, string> = {
  [ScenarioTriggerType.Schedule]: 'Расписание',
  [ScenarioTriggerType.EmptyHome]: 'Пустой дом',
  [ScenarioTriggerType.NonEmptyHome]: 'Непустой дом',
  [ScenarioTriggerType.DeviceOnline]: 'Устройство онлайн',
  [ScenarioTriggerType.DeviceOffline]: 'Устройство оффлайн',
  [ScenarioTriggerType.DevicePowerOn]: 'Устройство включено',
  [ScenarioTriggerType.DevicePowerOff]: 'Устройство выключено',
  [ScenarioTriggerType.TelegramCommand]: 'Телеграм команда',
};

const ADD_SCENARIO_TRIGGER_FIELDS_INFO: Record<AddScenarioTriggerPayloadField, { icon: string; name: string }> = {
  name: {
    icon: '🅰️',
    name: 'Название',
  },
};

export function getScenarioStepTypeIcon(scenarioStepType: ScenarioStepType): string {
  return SCENARIO_STEP_TYPE_ICON_MAP[scenarioStepType];
}

export function getScenarioStepTypeString(scenarioStepType: ScenarioStepType): string {
  return SCENARIO_STEP_TYPE_NAME_MAP[scenarioStepType];
}

export function getScenarioTriggerTypeIcon(scenarioTriggerType: ScenarioTriggerType): string {
  return SCENARIO_TRIGGER_TYPE_ICON_MAP[scenarioTriggerType];
}

export function getScenarioTriggerTypeString(scenarioTriggerType: ScenarioTriggerType): string {
  return SCENARIO_TRIGGER_TYPE_NAME_MAP[scenarioTriggerType];
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

  // TODO: show scenario step content (payload)

  return Markdown.create`🅰️ ${Markdown.bold('Название')}: ${indexString && Markdown.create`${indexString} `}${
    scenarioStep.name
  }
${scenarioStep.isActive ? '🟢' : '🔴'} ${Markdown.bold('Статус:')} ${scenarioStep.isActive ? 'Активен' : 'Не активен'}
🔨 ${Markdown.bold('Тип:')} ${getScenarioStepTypeIcon(scenarioStep.type)} ${getScenarioStepTypeString(
    scenarioStep.type,
  )}`;
}

export function formatScenarioTriggerField<Field extends AddScenarioTriggerPayloadField>(
  field: Field,
  value: AddScenarioTriggerPayload[Field],
): Markdown {
  const { icon, name } = ADD_SCENARIO_TRIGGER_FIELDS_INFO[field];

  return Markdown.create`${icon} ${Markdown.bold(name)}: ${value}`;
}

export function formatScenarioTriggerFields<Field extends AddScenarioStepPayloadField>(
  data: Pick<AddScenarioTriggerPayload, Field>,
  fields: Field[],
): Markdown {
  return Markdown.join(
    fields.map((field) => {
      return formatScenarioTriggerField(field, data[field]);
    }),
    '\n',
  );
}

export function formatScenarioTriggerEnteredFields(
  addScenarioTriggerPayload: AddScenarioTriggerPayload,
  fields: [AddScenarioTriggerPayloadField, ...AddScenarioTriggerPayloadField[]],
): Markdown {
  return Markdown.create`${Markdown.bold('Введенные данные')}:
${formatScenarioTriggerFields(addScenarioTriggerPayload, fields)}`;
}

export type FormatScenarioTriggerOptions = {
  indexString?: string;
};

export function formatScenarioTrigger(trigger: ScenarioTrigger, options: FormatScenarioTriggerOptions = {}): Markdown {
  const { indexString } = options;

  // TODO: show scenario trigger content (payload)

  return Markdown.create`🅰️ ${Markdown.bold('Название')}: ${indexString && Markdown.create`${indexString} `}${
    trigger.name
  }
${trigger.isActive ? '🟢' : '🔴'} ${Markdown.bold('Статус:')} ${trigger.isActive ? 'Активен' : 'Не активен'}
🔨 ${Markdown.bold('Тип:')} ${getScenarioTriggerTypeIcon(trigger.type)} ${getScenarioTriggerTypeString(trigger.type)}`;
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

export function getBackToAddStepSetTypeKeyboardButtons(currentScenarioId: number): InlineKeyboardButtons {
  return [
    [
      backToCallbackButton('К выбору типа', {
        type: ScenariosManagerCallbackButtonType.AddScenarioStepSetType,
      }),
    ],
    [
      backToCallbackButton('К шагам', {
        type: ScenariosManagerCallbackButtonType.OpenScenarioSteps,
        scenarioId: currentScenarioId,
      }),
    ],
  ];
}

export async function getBackToAddStepSetTypeKeyboard(currentScenarioId: number): Promise<InlineKeyboard> {
  return callbackDataProvider.buildInlineKeyboard(getBackToAddStepSetTypeKeyboardButtons(currentScenarioId));
}

export function getBackToAddTriggerSetTypeKeyboardButtons(currentScenarioId: number): InlineKeyboardButtons {
  return [
    [
      backToCallbackButton('К выбору типа', {
        type: ScenariosManagerCallbackButtonType.AddScenarioTriggerSetType,
      }),
    ],
    [
      backToCallbackButton('К триггерам', {
        type: ScenariosManagerCallbackButtonType.OpenScenarioTriggers,
        scenarioId: currentScenarioId,
      }),
    ],
  ];
}
