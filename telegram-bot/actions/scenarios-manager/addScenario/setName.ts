import { TelegramUserState } from '@prisma/client';
import { Markdown } from '@tg-sensei/bot';
import scenariosManager from 'scenarios-manager/manager';

import { ActionsStreamAction, MessageAction } from 'telegram-bot/types/actions';
import { InlineKeyboard } from 'telegram-bot/types/keyboard';
import { ScenariosManagerCallbackButtonType } from 'telegram-bot/types/keyboard/scenarios-manager';

import { backToCallbackButton } from 'telegram-bot/utilities/keyboard';

import { getScenarioAction } from 'telegram-bot/actions/scenarios-manager/scenarios/scenario/item';
import { callbackDataProvider, userDataProvider } from 'telegram-bot/bot';

const SET_NAME_KEYBOARD: InlineKeyboard = [
  [
    backToCallbackButton('К сценариям', {
      type: ScenariosManagerCallbackButtonType.OpenStatus,
    }),
  ],
];

callbackDataProvider.handle(ScenariosManagerCallbackButtonType.AddScenario, async ({ user }) => {
  await userDataProvider.setUserData(user.id, {
    ...user.data,
    state: TelegramUserState.AddScenarioSetName,
  });

  return new MessageAction({
    content: {
      type: 'text',
      text: Markdown.italic('Введите название сценария'),
    },
    replyMarkup: SET_NAME_KEYBOARD,
  });
});

userDataProvider.handle(TelegramUserState.AddScenarioSetName, async ({ message, user }) => {
  const name = message.text;

  if (!name) {
    return new MessageAction({
      content: {
        type: 'text',
        text: 'Название сценария должно содержать как минимум 1 символ',
      },
      replyMarkup: SET_NAME_KEYBOARD,
    });
  }

  if (!(await scenariosManager.isNameAllowed(name))) {
    return new MessageAction({
      content: {
        type: 'text',
        text: 'Название сценария должно быть уникальным',
      },
      replyMarkup: SET_NAME_KEYBOARD,
    });
  }

  const scenario = await scenariosManager.addScenario({
    name,
  });

  await userDataProvider.setUserData(user.id, {
    ...user.data,
    state: TelegramUserState.Waiting,
  });

  return new ActionsStreamAction(async function* () {
    yield new MessageAction({
      content: {
        type: 'text',
        text: 'Сценарий добавлен!',
      },
    });

    yield getScenarioAction(scenario.id);
  });
});
