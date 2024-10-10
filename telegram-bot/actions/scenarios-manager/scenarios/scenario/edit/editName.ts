import { TelegramUserState } from '@prisma/client';
import scenariosManager from 'scenarios-manager/manager';

import { EditScenarioPayload } from 'scenarios-manager/types/scenario';
import { ActionsStreamAction, MessageAction } from 'telegram-bot/types/actions';
import { ScenariosManagerCallbackButtonType } from 'telegram-bot/types/keyboard/scenarios-manager';

import { getEditScenarioPayload } from 'scenarios-manager/utilities/payload';
import { getBackToEditScenarioKeyboard } from 'telegram-bot/utilities/actions/scenarios-manager';

import { getEditScenarioAction } from 'telegram-bot/actions/scenarios-manager/scenarios/scenario/edit/root';
import { callbackDataProvider, userDataProvider } from 'telegram-bot/bot';

callbackDataProvider.handle(ScenariosManagerCallbackButtonType.EditScenarioName, async ({ data, user }) => {
  const newPayload: EditScenarioPayload = {
    scenarioId: data.scenarioId,
  };

  await userDataProvider.setUserData(user.id, {
    ...user.data,
    state: TelegramUserState.EditScenarioName,
    editScenarioPayload: newPayload,
  });

  return new MessageAction({
    content: {
      type: 'text',
      text: 'Введите новое название',
    },
    replyMarkup: getBackToEditScenarioKeyboard(data.scenarioId),
  });
});

userDataProvider.handle(TelegramUserState.EditScenarioName, async ({ message, user }) => {
  const editScenarioPayload = getEditScenarioPayload(user.data.editScenarioPayload);

  if (!editScenarioPayload) {
    return;
  }

  const { scenarioId } = editScenarioPayload;
  const name = message.text;

  if (!name) {
    return new MessageAction({
      content: {
        type: 'text',
        text: 'Название сценария должно содержать как минимум 1 символ',
      },
      replyMarkup: getBackToEditScenarioKeyboard(scenarioId),
    });
  }

  if (!(await scenariosManager.isNameAllowed(name))) {
    return new MessageAction({
      content: {
        type: 'text',
        text: 'Название сценария должно быть уникальным',
      },
      replyMarkup: getBackToEditScenarioKeyboard(scenarioId),
    });
  }

  await scenariosManager.editScenario(scenarioId, {
    name,
  });

  await userDataProvider.setUserData(user.id, {
    ...user.data,
    state: TelegramUserState.Waiting,
    editScenarioPayload: null,
  });

  return new ActionsStreamAction(async function* () {
    yield new MessageAction({
      content: {
        type: 'text',
        text: 'Название изменено',
      },
    });

    yield getEditScenarioAction(scenarioId);
  });
});
