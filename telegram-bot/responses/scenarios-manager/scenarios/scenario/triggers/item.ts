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
import { formatScenarioTrigger } from 'telegram-bot/utilities/responses/scenarios-manager';

import { callbackDataProvider } from 'telegram-bot/bot';
import { getScenarioTriggersResponse } from 'telegram-bot/responses/scenarios-manager/scenarios/scenario/triggers/list';

callbackDataProvider.handle(ScenariosManagerCallbackButtonType.OpenScenarioTrigger, async (ctx) => {
  const { triggerId, withDeleteConfirm } = ctx.callbackData;

  await ctx.respondWith(
    await getScenarioTriggerResponse(triggerId, {
      withDeleteConfirm,
    }),
  );
});

callbackDataProvider.handle(ScenariosManagerCallbackButtonType.ScenarioTriggerDeleteConfirm, async (ctx) => {
  const {
    user,
    callbackData: { triggerId },
  } = ctx;
  const trigger = await scenariosManager.getScenarioTrigger(triggerId);

  await scenariosManager.deleteScenarioTrigger(triggerId);

  await ctx.respondWith(
    new MessageWithNotificationResponse({
      text: 'Триггер успешно удален',
      updateResponse: getScenarioTriggersResponse(trigger.scenarioId, {
        userId: user.id,
      }),
    }),
  );
});

callbackDataProvider.handle(ScenariosManagerCallbackButtonType.ScenarioTriggerSetActive, async (ctx) => {
  const { triggerId, isActive } = ctx.callbackData;

  await scenariosManager.editScenarioTrigger(triggerId, {
    isActive,
  });

  await ctx.respondWith(
    new MessageWithNotificationResponse({
      text: `Триггер ${isActive ? 'включен' : 'выключен'}`,
      updateResponse: await getScenarioTriggerResponse(triggerId),
    }),
  );
});

export type GetScenarioTriggerResponseOptions = {
  withDeleteConfirm?: boolean;
  mode?: MessageResponseMode;
};

export async function getScenarioTriggerResponse(
  triggerId: number,
  options: GetScenarioTriggerResponseOptions = {},
): Promise<MessageResponse> {
  const { withDeleteConfirm = false, mode } = options;

  const trigger = await scenariosManager.getScenarioTrigger(triggerId);

  return new MessageResponse({
    mode,
    content: formatScenarioTrigger(trigger),
    replyMarkup: await callbackDataProvider.buildInlineKeyboard([
      [
        refreshCallbackButton({
          type: ScenariosManagerCallbackButtonType.OpenScenarioTrigger,
          triggerId,
          isRefresh: true,
        }),
        activateCallbackButton(trigger.isActive, (isActive) => ({
          type: ScenariosManagerCallbackButtonType.ScenarioTriggerSetActive,
          triggerId,
          isActive: !isActive,
        })),
      ],
      [
        deleteCallbackButton(
          withDeleteConfirm,
          {
            type: ScenariosManagerCallbackButtonType.ScenarioTriggerDeleteConfirm,
            triggerId,
          },
          {
            type: ScenariosManagerCallbackButtonType.OpenScenarioTrigger,
            triggerId,
            withDeleteConfirm: true,
          },
        ),
      ],
      [
        backToCallbackButton('К триггерам', {
          type: ScenariosManagerCallbackButtonType.OpenScenarioTriggers,
          scenarioId: trigger.scenarioId,
        }),
      ],
    ]),
  });
}
