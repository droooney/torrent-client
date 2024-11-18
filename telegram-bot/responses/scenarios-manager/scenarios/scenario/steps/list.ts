import { ScenarioStep } from '@prisma/client';
import { Markdown } from '@tg-sensei/bot';

import { getPaginationInfo } from 'db/utilities/pagination';

import { ScenariosManagerCallbackButtonType } from 'telegram-bot/types/keyboard/scenarios-manager';

import {
  addCallbackButton,
  backCallbackButton,
  callbackButton,
  refreshCallbackButton,
} from 'telegram-bot/utilities/keyboard';
import PaginationMessageResponse from 'telegram-bot/utilities/responses/PaginationMessageResponse';
import { formatScenarioStep } from 'telegram-bot/utilities/responses/scenarios-manager';

import { callbackDataProvider } from 'telegram-bot/bot';

callbackDataProvider.handle(ScenariosManagerCallbackButtonType.OpenScenarioSteps, async (ctx) => {
  const { scenarioId, page } = ctx.callbackData;

  await ctx.respondWith(getScenarioStepsResponse(scenarioId, page));
});

export function getScenarioStepsResponse(
  scenarioId: number,
  page: number = 0,
): PaginationMessageResponse<ScenarioStep> {
  return new PaginationMessageResponse({
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
