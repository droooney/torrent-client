import { Markdown, MessageResponse } from '@tg-sensei/bot';
import scenariosManager from 'scenarios-manager/manager';

import { RootCallbackButtonType } from 'telegram-bot/types/keyboard/root';
import { ScenariosManagerCallbackButtonType } from 'telegram-bot/types/keyboard/scenarios-manager';

import {
  addCallbackButton,
  backCallbackButton,
  listCallbackButton,
  refreshCallbackButton,
} from 'telegram-bot/utilities/keyboard';

import { callbackDataProvider } from 'telegram-bot/bot';

callbackDataProvider.handle(ScenariosManagerCallbackButtonType.OpenStatus, async (ctx) => {
  await ctx.respondWith(await getStatusResponse());
});

async function getStatusResponse(): Promise<MessageResponse> {
  const activeScenarios = await scenariosManager.getActiveScenarios();
  const text = Markdown.create``;

  if (activeScenarios.length > 0) {
    text.add`${Markdown.bold('Активные сценарии:')}

${activeScenarios.map(({ name }) => `- ${name}`).join('\n')}`;
  } else {
    text.add`${Markdown.italic('Нет активных сценариев')}`;
  }

  return new MessageResponse({
    content: text,
    replyMarkup: await callbackDataProvider.buildInlineKeyboard([
      [
        refreshCallbackButton({
          type: ScenariosManagerCallbackButtonType.OpenStatus,
          isRefresh: true,
        }),
        addCallbackButton({
          type: ScenariosManagerCallbackButtonType.AddScenario,
        }),
      ],
      [
        listCallbackButton({
          type: ScenariosManagerCallbackButtonType.OpenScenariosList,
        }),
      ],
      [
        backCallbackButton({
          type: RootCallbackButtonType.OpenRoot,
        }),
      ],
    ]),
  });
}
