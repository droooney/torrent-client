import { Scenario, ScenarioStepType } from '@prisma/client';
import { Markdown, MessageResponse, ResponsesStreamResponse } from '@tg-sensei/bot';
import scenariosManager from 'scenarios-manager/manager';

import { getPaginationInfo } from 'db/utilities/pagination';

import { ScenariosManagerCallbackButtonType } from 'telegram-bot/types/keyboard/scenarios-manager';

import { getAddStepPayload } from 'scenarios-manager/utilities/payload';
import { backToCallbackButton, callbackButton, refreshCallbackButton } from 'telegram-bot/utilities/keyboard';
import PaginationMessageResponse from 'telegram-bot/utilities/responses/PaginationMessageResponse';
import { formatScenario } from 'telegram-bot/utilities/responses/scenarios-manager';
import CustomError, { ErrorCode } from 'utilities/CustomError';

import { callbackDataProvider } from 'telegram-bot/bot';
import { getScenarioStepResponse } from 'telegram-bot/responses/scenarios-manager/scenarios/scenario/steps/item';

callbackDataProvider.handle(ScenariosManagerCallbackButtonType.AddScenarioStepScenariosList, async (ctx) => {
  const {
    user,
    callbackData: { page },
  } = ctx;
  const addStepPayload = getAddStepPayload(user.data.addScenarioStepPayload);

  await ctx.respondWith(getAddScenarioSetScenarioResponse(addStepPayload.scenarioId, page));
});

callbackDataProvider.handle(ScenariosManagerCallbackButtonType.AddScenarioStepScenario, async (ctx) => {
  const {
    user,
    callbackData: { scenarioId },
  } = ctx;
  const addStepPayload = getAddStepPayload(user.data.addScenarioStepPayload);

  if (addStepPayload.runParams.type !== ScenarioStepType.RunScenario) {
    throw new CustomError(ErrorCode.UNSUPPORTED, 'Неизвестное действие');
  }

  const scenarioStep = await scenariosManager.addScenarioStep({
    ...addStepPayload,
    runParams: {
      ...addStepPayload.runParams,
      scenarioId,
    },
  });

  await ctx.respondWith(
    new ResponsesStreamResponse(async function* () {
      yield new MessageResponse({
        content: 'Шаг добавлен!',
      });

      yield getScenarioStepResponse(scenarioStep.id, {
        mode: 'separate',
      });
    }),
  );
});

export function getAddScenarioSetScenarioResponse(
  currentScenarioId: number,
  page: number = 0,
): PaginationMessageResponse<Scenario> {
  return new PaginationMessageResponse({
    page,
    emptyPageText: Markdown.italic('Нет сценариев'),
    getPageText: (pageText) => Markdown.create`${Markdown.italic('Выберите сценарий')}


${pageText}`,
    getPageItemsInfo: async (options) =>
      getPaginationInfo({
        table: 'scenario',
        findOptions: {
          where: {
            id: {
              not: currentScenarioId,
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        pagination: options,
      }),
    getPageButtonCallbackData: (page) => ({
      type: ScenariosManagerCallbackButtonType.AddScenarioStepScenariosList,
      page,
    }),
    getItemButton: (scenario, indexIcon) =>
      callbackButton(indexIcon, scenario.name, {
        type: ScenariosManagerCallbackButtonType.AddScenarioStepScenario,
        scenarioId: scenario.id,
      }),
    getItemText: (scenario, indexString) =>
      formatScenario(scenario, {
        indexString,
      }),
    getKeyboard: (paginationButtons) => [
      [
        refreshCallbackButton({
          type: ScenariosManagerCallbackButtonType.AddScenarioStepScenariosList,
          page,
          isRefresh: true,
        }),
      ],
      ...paginationButtons,
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
    ],
  });
}
