import { MessageActionMode } from '@tg-sensei/bot';
import scenariosManager from 'scenarios-manager/manager';

import { MessageAction } from 'telegram-bot/types/actions';
import { ScenariosManagerCallbackButtonType } from 'telegram-bot/types/keyboard/scenarios-manager';

import MessageWithNotificationAction from 'telegram-bot/utilities/actions/MessageWithNotificationAction';
import RefreshDataAction from 'telegram-bot/utilities/actions/RefreshDataAction';
import { formatScenarioStep } from 'telegram-bot/utilities/actions/scenarios-manager';
import {
  activateCallbackButton,
  backToCallbackButton,
  deleteCallbackButton,
  refreshCallbackButton,
} from 'telegram-bot/utilities/keyboard';

import { getScenarioStepsAction } from 'telegram-bot/actions/scenarios-manager/scenarios/scenario/steps/list';
import { callbackDataProvider } from 'telegram-bot/bot';

callbackDataProvider.handle(ScenariosManagerCallbackButtonType.OpenScenarioStep, async ({ data }) => {
  const action = await getScenarioStepAction(data.stepId, {
    withDeleteConfirm: data.withDeleteConfirm,
  });

  return data.isRefresh ? new RefreshDataAction(action) : action;
});

callbackDataProvider.handle(ScenariosManagerCallbackButtonType.ScenarioStepDeleteConfirm, async ({ data }) => {
  const scenarioStep = await scenariosManager.getScenarioStep(data.stepId);

  await scenariosManager.deleteScenarioStep(data.stepId);

  return new MessageWithNotificationAction({
    text: 'Шаг успешно удален',
    updateAction: await getScenarioStepsAction(scenarioStep.scenarioId),
  });
});

callbackDataProvider.handle(ScenariosManagerCallbackButtonType.ScenarioStepSetActive, async ({ data }) => {
  await scenariosManager.editScenarioStep(data.stepId, {
    isActive: data.isActive,
  });

  return new MessageWithNotificationAction({
    text: `Шаг ${data.isActive ? 'включен' : 'выключен'}`,
    updateAction: await getScenarioStepAction(data.stepId),
  });
});

export type GetScenarioStepActionOptions = {
  withDeleteConfirm?: boolean;
  mode?: MessageActionMode;
};

export async function getScenarioStepAction(
  stepId: number,
  options: GetScenarioStepActionOptions = {},
): Promise<MessageAction> {
  const { withDeleteConfirm = false, mode } = options;

  const scenarioStep = await scenariosManager.getScenarioStep(stepId);

  return new MessageAction({
    mode,
    content: {
      type: 'text',
      text: formatScenarioStep(scenarioStep),
    },
    replyMarkup: [
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
    ],
  });
}
