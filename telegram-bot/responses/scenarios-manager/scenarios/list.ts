import { Scenario } from '@prisma/client';
import { Markdown } from '@tg-sensei/bot';

import { getPaginationInfo } from 'db/utilities/pagination';

import { ScenariosManagerCallbackButtonType } from 'telegram-bot/types/keyboard/scenarios-manager';

import { backCallbackButton, callbackButton, refreshCallbackButton } from 'telegram-bot/utilities/keyboard';
import PaginationMessageResponse from 'telegram-bot/utilities/responses/PaginationMessageResponse';
import { formatScenario } from 'telegram-bot/utilities/responses/scenarios-manager';

import { callbackDataProvider } from 'telegram-bot/bot';

callbackDataProvider.handle(ScenariosManagerCallbackButtonType.OpenScenariosList, async (ctx) => {
  const { page } = ctx.callbackData;

  await ctx.respondWith(getScenariosListResponse(page));
});

export function getScenariosListResponse(page: number = 0): PaginationMessageResponse<Scenario> {
  return new PaginationMessageResponse({
    page,
    emptyPageText: Markdown.italic('Нет сценариев'),
    getPageItemsInfo: async (options) =>
      getPaginationInfo({
        table: 'scenario',
        findOptions: {
          orderBy: {
            createdAt: 'asc',
          },
        },
        pagination: options,
      }),
    getPageButtonCallbackData: (page) => ({
      type: ScenariosManagerCallbackButtonType.OpenScenariosList,
      page,
    }),
    getItemButton: (scenario, indexIcon) =>
      callbackButton(indexIcon, scenario.name, {
        type: ScenariosManagerCallbackButtonType.OpenScenario,
        scenarioId: scenario.id,
      }),
    getItemText: (scenario, indexString) =>
      formatScenario(scenario, {
        indexString,
      }),
    getKeyboard: (paginationButtons) => [
      [
        refreshCallbackButton({
          type: ScenariosManagerCallbackButtonType.OpenScenariosList,
          page,
          isRefresh: true,
        }),
      ],
      ...paginationButtons,
      [
        backCallbackButton({
          type: ScenariosManagerCallbackButtonType.OpenStatus,
        }),
      ],
    ],
  });
}
