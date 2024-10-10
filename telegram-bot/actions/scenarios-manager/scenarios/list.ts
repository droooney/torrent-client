import { Scenario } from '@prisma/client';
import { Markdown } from '@tg-sensei/bot';

import { getPaginationInfo } from 'db/utilities/pagination';

import { ScenariosManagerCallbackButtonType } from 'telegram-bot/types/keyboard/scenarios-manager';

import PaginationMessageAction from 'telegram-bot/utilities/actions/PaginationMessageAction';
import RefreshDataAction from 'telegram-bot/utilities/actions/RefreshDataAction';
import { formatScenario } from 'telegram-bot/utilities/actions/scenarios-manager';
import { backCallbackButton, callbackButton, refreshCallbackButton } from 'telegram-bot/utilities/keyboard';

import { callbackDataProvider } from 'telegram-bot/bot';

callbackDataProvider.handle(ScenariosManagerCallbackButtonType.OpenScenariosList, async ({ data }) => {
  return getScenariosListAction(data.page);
});

callbackDataProvider.handle(ScenariosManagerCallbackButtonType.RefreshScenariosList, async ({ data }) => {
  return new RefreshDataAction(await getScenariosListAction(data.page));
});

export async function getScenariosListAction(page: number = 0): Promise<PaginationMessageAction<Scenario>> {
  return new PaginationMessageAction({
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
          type: ScenariosManagerCallbackButtonType.RefreshScenariosList,
          page,
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
