import { ScenarioTrigger, ScenarioTriggerType } from '@prisma/client';
import { Markdown } from '@tg-sensei/bot';

import { getPaginationInfo } from 'db/utilities/pagination';

import { ScenariosManagerCallbackButtonType } from 'telegram-bot/types/keyboard/scenarios-manager';

import {
  addCallbackButton,
  backCallbackButton,
  callbackButton,
  refreshCallbackButton,
} from 'telegram-bot/utilities/keyboard';
import PaginationMessageResponse from 'telegram-bot/utilities/responses/PaginationMessageResponse';
import { formatScenarioTrigger } from 'telegram-bot/utilities/responses/scenarios-manager';

import { callbackDataProvider } from 'telegram-bot/bot';

callbackDataProvider.handle(ScenariosManagerCallbackButtonType.OpenScenarioTriggers, async (ctx) => {
  const {
    user,
    callbackData: { scenarioId, page },
  } = ctx;

  await ctx.respondWith(
    getScenarioTriggersResponse(scenarioId, {
      userId: user.id,
      page,
    }),
  );
});

export type GetScenarioTriggersResponse = {
  userId: number;
  page?: number;
};

export function getScenarioTriggersResponse(
  scenarioId: number,
  options: GetScenarioTriggersResponse,
): PaginationMessageResponse<ScenarioTrigger> {
  const { userId, page } = options;

  return new PaginationMessageResponse({
    page,
    emptyPageText: Markdown.italic('Нет триггеров'),
    getPageItemsInfo: async (options) =>
      getPaginationInfo({
        table: 'scenarioTrigger',
        findOptions: {
          where: {
            scenarioId,
            OR: [
              {
                type: {
                  not: ScenarioTriggerType.TelegramCommand,
                },
              },
              {
                payload: {
                  path: ['userId'],
                  equals: userId,
                },
              },
            ],
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        pagination: options,
      }),
    getPageButtonCallbackData: (page) => ({
      type: ScenariosManagerCallbackButtonType.OpenScenarioTriggers,
      scenarioId,
      page,
    }),
    getItemButton: (trigger, indexIcon) =>
      callbackButton(indexIcon, trigger.name, {
        type: ScenariosManagerCallbackButtonType.OpenScenarioTrigger,
        triggerId: trigger.id,
      }),
    getItemText: (trigger, indexString) =>
      formatScenarioTrigger(trigger, {
        indexString,
      }),
    getKeyboard: (paginationButtons) => [
      [
        refreshCallbackButton({
          type: ScenariosManagerCallbackButtonType.OpenScenarioTriggers,
          scenarioId,
          page,
          isRefresh: true,
        }),
        addCallbackButton({
          type: ScenariosManagerCallbackButtonType.AddScenarioTriggerSetName,
          scenarioId,
        }),
      ],
      ...paginationButtons,
      [
        backCallbackButton({
          type: ScenariosManagerCallbackButtonType.OpenScenario,
          scenarioId,
        }),
      ],
    ],
  });
}
