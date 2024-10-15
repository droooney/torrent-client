import scenariosManager from 'scenarios-manager/manager';

import { ActionsStreamAction, MessageAction, NotificationAction } from 'telegram-bot/types/actions';
import { ScenariosManagerCallbackButtonType } from 'telegram-bot/types/keyboard/scenarios-manager';

import MessageWithNotificationAction from 'telegram-bot/utilities/actions/MessageWithNotificationAction';
import RefreshDataAction from 'telegram-bot/utilities/actions/RefreshDataAction';
import { formatScenario } from 'telegram-bot/utilities/actions/scenarios-manager';
import {
  activateCallbackButton,
  backToCallbackButton,
  callbackButton,
  deleteCallbackButton,
  editCallbackButton,
  refreshCallbackButton,
} from 'telegram-bot/utilities/keyboard';

import { getScenariosListAction } from 'telegram-bot/actions/scenarios-manager/scenarios/list';
import { callbackDataProvider } from 'telegram-bot/bot';

callbackDataProvider.handle(ScenariosManagerCallbackButtonType.OpenScenario, async ({ data }) => {
  const action = await getScenarioAction(data.scenarioId, {
    withDeleteConfirm: data.withDeleteConfirm,
  });

  return data.isRefresh ? new RefreshDataAction(action) : action;
});

callbackDataProvider.handle(ScenariosManagerCallbackButtonType.RunScenario, async ({ data }) => {
  return new ActionsStreamAction(async function* () {
    yield new NotificationAction({
      text: 'Сценарий начал выполняться',
    });

    await scenariosManager.runScenario(data.scenarioId);

    yield new MessageAction({
      mode: 'separate',
      content: {
        type: 'text',
        text: 'Сценарий успешно выполнен!',
      },
    });
  });
});

callbackDataProvider.handle(ScenariosManagerCallbackButtonType.ScenarioDeleteConfirm, async ({ data }) => {
  await scenariosManager.deleteScenario(data.scenarioId);

  return new MessageWithNotificationAction({
    text: 'Сценарий успешно удален',
    updateAction: getScenariosListAction(),
  });
});

callbackDataProvider.handle(ScenariosManagerCallbackButtonType.ScenarioSetActive, async ({ data }) => {
  await scenariosManager.editScenario(data.scenarioId, {
    isActive: data.isActive,
  });

  return new MessageWithNotificationAction({
    text: `Сценарий ${data.isActive ? 'включен' : 'выключен'}`,
    updateAction: await getScenarioAction(data.scenarioId),
  });
});

export type GetScenarioActionOptions = {
  withDeleteConfirm?: boolean;
};

export async function getScenarioAction(
  scenarioId: number,
  options: GetScenarioActionOptions = {},
): Promise<MessageAction> {
  const { withDeleteConfirm = false } = options;

  const scenario = await scenariosManager.getScenario(scenarioId);

  return new MessageAction({
    content: {
      type: 'text',
      text: formatScenario(scenario),
    },
    replyMarkup: [
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
    ],
  });
}
