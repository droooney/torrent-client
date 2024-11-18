import { MessageResponse } from '@tg-sensei/bot';
import scenariosManager from 'scenarios-manager/manager';

import { ScenariosManagerCallbackButtonType } from 'telegram-bot/types/keyboard/scenarios-manager';

import { backToCallbackButton, callbackButton } from 'telegram-bot/utilities/keyboard';
import { formatScenario } from 'telegram-bot/utilities/responses/scenarios-manager';

import { callbackDataProvider } from 'telegram-bot/bot';

callbackDataProvider.handle(ScenariosManagerCallbackButtonType.EditScenario, async (ctx) => {
  const { scenarioId } = ctx.callbackData;

  await ctx.respondWith(await getEditScenarioResponse(scenarioId));
});

export async function getEditScenarioResponse(scenarioId: number): Promise<MessageResponse> {
  const scenario = await scenariosManager.getScenario(scenarioId);

  return new MessageResponse({
    content: formatScenario(scenario),
    replyMarkup: await callbackDataProvider.buildInlineKeyboard([
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
    ]),
  });
}
