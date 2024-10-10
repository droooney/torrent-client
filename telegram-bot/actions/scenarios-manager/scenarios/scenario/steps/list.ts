import { ScenarioStep } from '@prisma/client';
import { Markdown } from '@tg-sensei/bot';

import { getPaginationInfo } from 'db/utilities/pagination';

import { ScenariosManagerCallbackButtonType } from 'telegram-bot/types/keyboard/scenarios-manager';

import PaginationMessageAction from 'telegram-bot/utilities/actions/PaginationMessageAction';
import RefreshDataAction from 'telegram-bot/utilities/actions/RefreshDataAction';
import { formatScenarioStep } from 'telegram-bot/utilities/actions/scenarios-manager';
import { backCallbackButton, callbackButton, refreshCallbackButton } from 'telegram-bot/utilities/keyboard';

import { callbackDataProvider } from 'telegram-bot/bot';

callbackDataProvider.handle(ScenariosManagerCallbackButtonType.OpenScenarioSteps, async ({ data }) => {
  return getScenarioStepsAction(data.scenarioId, data.page);
});

callbackDataProvider.handle(ScenariosManagerCallbackButtonType.RefreshScenarioSteps, async ({ data }) => {
  return new RefreshDataAction(await getScenarioStepsAction(data.scenarioId, data.page));
});

export async function getScenarioStepsAction(
  scenarioId: number,
  page: number = 0,
): Promise<PaginationMessageAction<ScenarioStep>> {
  return new PaginationMessageAction({
    page,
    emptyPageText: Markdown.italic('Нет шагов'),
    getPageItemsInfo: async (options) =>
      getPaginationInfo({
        table: 'scenarioStep',
        findOptions: {
          where: {
            scenarioId,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        pagination: options,
      }),
    getPageButtonCallbackData: (page) => ({
      type: ScenariosManagerCallbackButtonType.OpenScenarioSteps,
      scenarioId,
      page,
    }),
    getItemButton: (scenarioStep, indexIcon) =>
      callbackButton(indexIcon, scenarioStep.name, {
        type: ScenariosManagerCallbackButtonType.OpenScenarioStep,
        stepId: scenarioStep.id,
      }),
    getItemText: (scenarioStep, indexString) =>
      formatScenarioStep(scenarioStep, {
        indexString,
      }),
    getKeyboard: (paginationButtons) => [
      [
        refreshCallbackButton({
          type: ScenariosManagerCallbackButtonType.RefreshScenarioSteps,
          scenarioId,
          page,
        }),
      ],
      ...paginationButtons,
      [
        backCallbackButton({
          type: ScenariosManagerCallbackButtonType.OpenScenario,
          scenarioId,
        }),
      ],
    ],
  });
}
