import { Scenario, ScenarioStepType } from '@prisma/client';
import { Markdown } from '@tg-sensei/bot';
import scenariosManager from 'scenarios-manager/manager';

import { getPaginationInfo } from 'db/utilities/pagination';

import { ActionsStreamAction, MessageAction } from 'telegram-bot/types/actions';
import { ScenariosManagerCallbackButtonType } from 'telegram-bot/types/keyboard/scenarios-manager';

import { getAddStepPayload } from 'scenarios-manager/utilities/payload';
import PaginationMessageAction from 'telegram-bot/utilities/actions/PaginationMessageAction';
import RefreshDataAction from 'telegram-bot/utilities/actions/RefreshDataAction';
import { formatScenario } from 'telegram-bot/utilities/actions/scenarios-manager';
import { backToCallbackButton, callbackButton, refreshCallbackButton } from 'telegram-bot/utilities/keyboard';
import CustomError, { ErrorCode } from 'utilities/CustomError';

import { getScenarioStepAction } from 'telegram-bot/actions/scenarios-manager/scenarios/scenario/steps/item';
import { callbackDataProvider } from 'telegram-bot/bot';

callbackDataProvider.handle(ScenariosManagerCallbackButtonType.AddScenarioStepScenariosList, async ({ data, user }) => {
  const addStepPayload = getAddStepPayload(user.data.addScenarioStepPayload);
  const action = getAddScenarioSetScenarioAction(addStepPayload.scenarioId, data.page);

  return data.isRefresh ? new RefreshDataAction(action) : action;
});

callbackDataProvider.handle(ScenariosManagerCallbackButtonType.AddScenarioStepScenario, async ({ data, user }) => {
  const addStepPayload = getAddStepPayload(user.data.addScenarioStepPayload);

  if (addStepPayload.runParams.type !== ScenarioStepType.RunScenario) {
    throw new CustomError(ErrorCode.UNSUPPORTED, 'Неизвестное действие');
  }

  const scenarioStep = await scenariosManager.addScenarioStep({
    ...addStepPayload,
    runParams: {
      ...addStepPayload.runParams,
      scenarioId: data.scenarioId,
    },
  });

  return new ActionsStreamAction(async function* () {
    yield new MessageAction({
      content: {
        type: 'text',
        text: 'Шаг добавлен!',
      },
    });

    yield getScenarioStepAction(scenarioStep.id, {
      mode: 'separate',
    });
  });
});

export function getAddScenarioSetScenarioAction(
  currentScenarioId: number,
  page: number = 0,
): PaginationMessageAction<Scenario> {
  return new PaginationMessageAction({
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
