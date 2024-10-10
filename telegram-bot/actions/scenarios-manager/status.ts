import { Markdown } from '@tg-sensei/bot';
import scenariosManager from 'scenarios-manager/manager';

import { MessageAction } from 'telegram-bot/types/actions';
import { RootCallbackButtonType } from 'telegram-bot/types/keyboard/root';
import { ScenariosManagerCallbackButtonType } from 'telegram-bot/types/keyboard/scenarios-manager';

import RefreshDataAction from 'telegram-bot/utilities/actions/RefreshDataAction';
import {
  addCallbackButton,
  backCallbackButton,
  listCallbackButton,
  refreshCallbackButton,
} from 'telegram-bot/utilities/keyboard';

import { callbackDataProvider } from 'telegram-bot/bot';

callbackDataProvider.handle(ScenariosManagerCallbackButtonType.OpenStatus, async () => {
  return getStatusAction();
});

callbackDataProvider.handle(ScenariosManagerCallbackButtonType.RefreshStatus, async () => {
  return new RefreshDataAction(await getStatusAction());
});

async function getStatusAction(): Promise<MessageAction> {
  const activeScenarios = await scenariosManager.getActiveScenarios();
  const text = Markdown.create``;

  if (activeScenarios.length > 0) {
    text.add`${Markdown.bold('Активные сценарии:')}

${activeScenarios.map(({ name }) => `- ${name}`).join('\n')}`;
  } else {
    text.add`${Markdown.italic('Нет активных сценариев')}`;
  }

  return new MessageAction({
    content: {
      type: 'text',
      text,
    },
    replyMarkup: [
      [
        refreshCallbackButton({
          type: ScenariosManagerCallbackButtonType.RefreshStatus,
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
    ],
  });
}
