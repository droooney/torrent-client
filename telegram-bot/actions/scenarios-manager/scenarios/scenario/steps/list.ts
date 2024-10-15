import { ScenarioStep } from '@prisma/client';
import { Markdown } from '@tg-sensei/bot';

import { getPaginationInfo } from 'db/utilities/pagination';

import { ScenariosManagerCallbackButtonType } from 'telegram-bot/types/keyboard/scenarios-manager';

import PaginationMessageAction from 'telegram-bot/utilities/actions/PaginationMessageAction';
import RefreshDataAction from 'telegram-bot/utilities/actions/RefreshDataAction';
import { formatScenarioStep } from 'telegram-bot/utilities/actions/scenarios-manager';
import {
  addCallbackButton,
  backCallbackButton,
  callbackButton,
  refreshCallbackButton,
} from 'telegram-bot/utilities/keyboard';

import { callbackDataProvider } from 'telegram-bot/bot';

callbackDataProvider.handle(ScenariosManagerCallbackButtonType.OpenScenarioSteps, async ({ data }) => {
  const action = getScenarioStepsAction(data.scenarioId, data.page);

  return data.isRefresh ? new RefreshDataAction(action) : action;
});

export function getScenarioStepsAction(scenarioId: number, page: number = 0): PaginationMessageAction<ScenarioStep> {
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
          type: ScenariosManagerCallbackButtonType.OpenScenarioSteps,
          scenarioId,
          page,
          isRefresh: true,
        }),
        addCallbackButton({
          type: ScenariosManagerCallbackButtonType.AddScenarioStepSetName,
          scenarioId,
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
