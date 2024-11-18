import { MessageResponse, NotificationResponse, ResponsesStreamResponse } from '@tg-sensei/bot';
import scenariosManager from 'scenarios-manager/manager';

import { ScenariosManagerCallbackButtonType } from 'telegram-bot/types/keyboard/scenarios-manager';

import {
  activateCallbackButton,
  backToCallbackButton,
  callbackButton,
  deleteCallbackButton,
  editCallbackButton,
  refreshCallbackButton,
} from 'telegram-bot/utilities/keyboard';
import MessageWithNotificationResponse from 'telegram-bot/utilities/responses/MessageWithNotificationResponse';
import { formatScenario } from 'telegram-bot/utilities/responses/scenarios-manager';

import { callbackDataProvider } from 'telegram-bot/bot';
import { getScenariosListResponse } from 'telegram-bot/responses/scenarios-manager/scenarios/list';

callbackDataProvider.handle(ScenariosManagerCallbackButtonType.OpenScenario, async (ctx) => {
  const { scenarioId, withDeleteConfirm } = ctx.callbackData;

  await ctx.respondWith(
    await getScenarioResponse(scenarioId, {
      withDeleteConfirm,
    }),
  );
});

callbackDataProvider.handle(ScenariosManagerCallbackButtonType.RunScenario, async (ctx) => {
  const { scenarioId } = ctx.callbackData;

  await ctx.respondWith(
    new ResponsesStreamResponse(async function* () {
      yield new NotificationResponse({
        text: 'Сценарий начал выполняться',
      });

      await scenariosManager.runScenario(scenarioId);

      yield new MessageResponse({
        mode: 'separate',
        content: 'Сценарий успешно выполнен!',
      });
    }),
  );
});

callbackDataProvider.handle(ScenariosManagerCallbackButtonType.ScenarioDeleteConfirm, async (ctx) => {
  const { scenarioId } = ctx.callbackData;

  await scenariosManager.deleteScenario(scenarioId);

  await ctx.respondWith(
    new MessageWithNotificationResponse({
      text: 'Сценарий успешно удален',
      updateResponse: getScenariosListResponse(),
    }),
  );
});

callbackDataProvider.handle(ScenariosManagerCallbackButtonType.ScenarioSetActive, async (ctx) => {
  const { scenarioId, isActive } = ctx.callbackData;

  await scenariosManager.editScenario(scenarioId, {
    isActive,
  });

  await ctx.respondWith(
    new MessageWithNotificationResponse({
      text: `Сценарий ${isActive ? 'включен' : 'выключен'}`,
      updateResponse: await getScenarioResponse(scenarioId),
    }),
  );
});

export type GetScenarioResponseOptions = {
  withDeleteConfirm?: boolean;
};

export async function getScenarioResponse(
  scenarioId: number,
  options: GetScenarioResponseOptions = {},
): Promise<MessageResponse> {
  const { withDeleteConfirm = false } = options;

  const scenario = await scenariosManager.getScenario(scenarioId);

  return new MessageResponse({
    content: formatScenario(scenario),
    replyMarkup: await callbackDataProvider.buildInlineKeyboard([
      [
        refreshCallbackButton({
          type: ScenariosManagerCallbackButtonType.OpenScenario,
          scenarioId,
          isRefresh: true,
        }),
        activateCallbackButton(scenario.isActive, (isActive) => ({
          type: ScenariosManagerCallbackButtonType.ScenarioSetActive,
          scenarioId,
          isActive: !isActive,
        })),
      ],
      [
        callbackButton('▶️', 'Выполнить', {
          type: ScenariosManagerCallbackButtonType.RunScenario,
          scenarioId,
        }),
        callbackButton('🔨', 'Шаги', {
          type: ScenariosManagerCallbackButtonType.OpenScenarioSteps,
          scenarioId,
        }),
      ],
      [
        editCallbackButton({
          type: ScenariosManagerCallbackButtonType.EditScenario,
          scenarioId,
        }),
        deleteCallbackButton(
          withDeleteConfirm,
          {
            type: ScenariosManagerCallbackButtonType.ScenarioDeleteConfirm,
            scenarioId,
          },
          {
            type: ScenariosManagerCallbackButtonType.OpenScenario,
            scenarioId,
            withDeleteConfirm: true,
          },
        ),
      ],
      [
        backToCallbackButton('К сценариям', {
          type: ScenariosManagerCallbackButtonType.OpenScenariosList,
        }),
      ],
    ]),
  });
}
