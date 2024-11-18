import { MessageResponse, MessageResponseMode } from '@tg-sensei/bot';
import scenariosManager from 'scenarios-manager/manager';

import { ScenariosManagerCallbackButtonType } from 'telegram-bot/types/keyboard/scenarios-manager';

import {
  activateCallbackButton,
  backToCallbackButton,
  deleteCallbackButton,
  refreshCallbackButton,
} from 'telegram-bot/utilities/keyboard';
import MessageWithNotificationResponse from 'telegram-bot/utilities/responses/MessageWithNotificationResponse';
import { formatScenarioStep } from 'telegram-bot/utilities/responses/scenarios-manager';

import { callbackDataProvider } from 'telegram-bot/bot';
import { getScenarioStepsResponse } from 'telegram-bot/responses/scenarios-manager/scenarios/scenario/steps/list';

callbackDataProvider.handle(ScenariosManagerCallbackButtonType.OpenScenarioStep, async (ctx) => {
  const { stepId, withDeleteConfirm } = ctx.callbackData;

  await ctx.respondWith(
    await getScenarioStepResponse(stepId, {
      withDeleteConfirm,
    }),
  );
});

callbackDataProvider.handle(ScenariosManagerCallbackButtonType.ScenarioStepDeleteConfirm, async (ctx) => {
  const { stepId } = ctx.callbackData;
  const scenarioStep = await scenariosManager.getScenarioStep(stepId);

  await scenariosManager.deleteScenarioStep(stepId);

  await ctx.respondWith(
    new MessageWithNotificationResponse({
      text: 'Шаг успешно удален',
      updateResponse: getScenarioStepsResponse(scenarioStep.scenarioId),
    }),
  );
});

callbackDataProvider.handle(ScenariosManagerCallbackButtonType.ScenarioStepSetActive, async (ctx) => {
  const { stepId, isActive } = ctx.callbackData;

  await scenariosManager.editScenarioStep(stepId, {
    isActive,
  });

  await ctx.respondWith(
    new MessageWithNotificationResponse({
      text: `Шаг ${isActive ? 'включен' : 'выключен'}`,
      updateResponse: await getScenarioStepResponse(stepId),
    }),
  );
});

export type GetScenarioStepResponseOptions = {
  withDeleteConfirm?: boolean;
  mode?: MessageResponseMode;
};

export async function getScenarioStepResponse(
  stepId: number,
  options: GetScenarioStepResponseOptions = {},
): Promise<MessageResponse> {
  const { withDeleteConfirm = false, mode } = options;

  const scenarioStep = await scenariosManager.getScenarioStep(stepId);

  return new MessageResponse({
    mode,
    content: formatScenarioStep(scenarioStep),
    replyMarkup: await callbackDataProvider.buildInlineKeyboard([
      [
        refreshCallbackButton({
          type: ScenariosManagerCallbackButtonType.OpenScenarioStep,
          stepId,
        }),
        activateCallbackButton(scenarioStep.isActive, (isActive) => ({
          type: ScenariosManagerCallbackButtonType.ScenarioStepSetActive,
          stepId,
          isActive: !isActive,
        })),
      ],
      [
        deleteCallbackButton(
          withDeleteConfirm,
          {
            type: ScenariosManagerCallbackButtonType.ScenarioStepDeleteConfirm,
            stepId,
          },
          {
            type: ScenariosManagerCallbackButtonType.OpenScenarioStep,
            stepId,
            withDeleteConfirm: true,
          },
        ),
      ],
      [
        backToCallbackButton('К шагам', {
          type: ScenariosManagerCallbackButtonType.OpenScenarioSteps,
          scenarioId: scenarioStep.scenarioId,
        }),
      ],
    ]),
  });
}
