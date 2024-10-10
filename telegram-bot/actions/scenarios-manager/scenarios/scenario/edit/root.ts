import scenariosManager from 'scenarios-manager/manager';

import { MessageAction } from 'telegram-bot/types/actions';
import { ScenariosManagerCallbackButtonType } from 'telegram-bot/types/keyboard/scenarios-manager';

import { formatScenario } from 'telegram-bot/utilities/actions/scenarios-manager';
import { backToCallbackButton, callbackButton } from 'telegram-bot/utilities/keyboard';

import { callbackDataProvider } from 'telegram-bot/bot';

callbackDataProvider.handle(ScenariosManagerCallbackButtonType.EditScenario, async ({ data }) => {
  return getEditScenarioAction(data.scenarioId);
});

export async function getEditScenarioAction(scenarioId: number): Promise<MessageAction> {
  const scenario = await scenariosManager.getScenario(scenarioId);

  return new MessageAction({
    content: {
      type: 'text',
      text: formatScenario(scenario),
    },
    replyMarkup: [
      [
        callbackButton('🅰️️', 'Изменить название', {
          type: ScenariosManagerCallbackButtonType.EditScenarioName,
          scenarioId,
        }),
      ],
      [
        backToCallbackButton('К сценарию', {
          type: ScenariosManagerCallbackButtonType.OpenScenario,
          scenarioId,
        }),
        backToCallbackButton('К списку', {
          type: ScenariosManagerCallbackButtonType.OpenScenariosList,
        }),
      ],
    ],
  });
}
