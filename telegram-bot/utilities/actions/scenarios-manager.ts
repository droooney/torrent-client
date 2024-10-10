import { Scenario } from '@prisma/client';
import { Markdown } from '@tg-sensei/bot';

import { InlineKeyboard } from 'telegram-bot/types/keyboard';
import { ScenariosManagerCallbackButtonType } from 'telegram-bot/types/keyboard/scenarios-manager';

import { backToCallbackButton } from 'telegram-bot/utilities/keyboard';

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

export function getBackToEditScenarioKeyboard(scenarioId: number): InlineKeyboard {
  return [
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
  ];
}
