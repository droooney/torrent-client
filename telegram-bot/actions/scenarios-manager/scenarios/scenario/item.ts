import scenariosManager from 'scenarios-manager/manager';

import { MessageAction } from 'telegram-bot/types/actions';
import { ScenariosManagerCallbackButtonType } from 'telegram-bot/types/keyboard/scenarios-manager';

import MessageWithNotificationAction from 'telegram-bot/utilities/actions/MessageWithNotificationAction';
import RefreshDataAction from 'telegram-bot/utilities/actions/RefreshDataAction';
import { formatScenario } from 'telegram-bot/utilities/actions/scenarios-manager';
import {
  activateCallbackButton,
  backToCallbackButton,
  deleteCallbackButton,
  refreshCallbackButton,
} from 'telegram-bot/utilities/keyboard';

import { getScenariosListAction } from 'telegram-bot/actions/scenarios-manager/scenarios/list';
import { callbackDataProvider } from 'telegram-bot/bot';

callbackDataProvider.handle(
  [ScenariosManagerCallbackButtonType.OpenScenario, ScenariosManagerCallbackButtonType.ScenarioDelete],
  async ({ data }) => {
    return getScenarioAction(data.scenarioId, {
      withDeleteConfirm: data.type === ScenariosManagerCallbackButtonType.ScenarioDelete,
    });
  },
);

callbackDataProvider.handle(ScenariosManagerCallbackButtonType.RefreshSScenario, async ({ data }) => {
  return new RefreshDataAction(await getScenarioAction(data.scenarioId));
});

callbackDataProvider.handle(ScenariosManagerCallbackButtonType.ScenarioDeleteConfirm, async ({ data }) => {
  await scenariosManager.deleteScenario(data.scenarioId);

  return new MessageWithNotificationAction({
    text: 'Сценарий успешно удален',
    updateAction: await getScenariosListAction(),
  });
});

callbackDataProvider.handle(ScenariosManagerCallbackButtonType.ScenarioSetActive, async ({ data }) => {
  await scenariosManager.setScenarioIsActive(data.scenarioId, data.isActive);

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

  const text = formatScenario(scenario);

  return new MessageAction({
    content: {
      type: 'text',
      text,
    },
    replyMarkup: [
      [
        refreshCallbackButton({
          type: ScenariosManagerCallbackButtonType.RefreshSScenario,
          scenarioId,
        }),
        activateCallbackButton(scenario.isActive, (isActive) => ({
          type: ScenariosManagerCallbackButtonType.ScenarioSetActive,
          scenarioId,
          isActive: !isActive,
        })),
      ],
      [
        deleteCallbackButton(
          withDeleteConfirm,
          {
            type: ScenariosManagerCallbackButtonType.ScenarioDeleteConfirm,
            scenarioId,
          },
          {
            type: ScenariosManagerCallbackButtonType.ScenarioDelete,
            scenarioId,
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
