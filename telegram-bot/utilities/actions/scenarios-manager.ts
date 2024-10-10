import { Scenario } from '@prisma/client';
import { Markdown } from '@tg-sensei/bot';

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
