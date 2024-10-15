import { TelegramUserState } from '@prisma/client';
import { Markdown } from '@tg-sensei/bot';
import scenariosManager from 'scenarios-manager/manager';

import { AddScenarioStepPayload } from 'scenarios-manager/types/scenario';
import { MessageAction } from 'telegram-bot/types/actions';
import { InlineKeyboard } from 'telegram-bot/types/keyboard';
import { ScenariosManagerCallbackButtonType } from 'telegram-bot/types/keyboard/scenarios-manager';

import ScenariosManager from 'scenarios-manager/utilities/ScenariosManager';
import { getAddStepPayload } from 'scenarios-manager/utilities/payload';
import { backToCallbackButton } from 'telegram-bot/utilities/keyboard';

import { getAddScenarioTypeSetTypeAction } from 'telegram-bot/actions/scenarios-manager/scenarios/scenario/steps/addStep/setType';
import { callbackDataProvider, userDataProvider } from 'telegram-bot/bot';

callbackDataProvider.handle(ScenariosManagerCallbackButtonType.AddScenarioStepSetName, async ({ data, user }) => {
  const newPayload: AddScenarioStepPayload = {
    ...ScenariosManager.defaultAddScenarioStepPayload,
    scenarioId: data.scenarioId,
  };

  await userDataProvider.setUserData(user.id, {
    ...user.data,
    state: TelegramUserState.AddScenarioStepSetName,
    addScenarioStepPayload: data.isBack ? user.data.addScenarioStepPayload : newPayload,
  });

  return new MessageAction({
    content: {
      type: 'text',
      text: Markdown.italic('Введите название шага'),
    },
    replyMarkup: getAddScenarioSetNameKeyboard(newPayload.scenarioId),
  });
});

userDataProvider.handle(TelegramUserState.AddScenarioStepSetName, async ({ message, user }) => {
  const addStepPayload = getAddStepPayload(user.data.addScenarioStepPayload);
  const name = message.text;

  if (!name) {
    return new MessageAction({
      content: {
        type: 'text',
        text: 'Название сценария должно содержать как минимум 1 символ',
      },
      replyMarkup: getAddScenarioSetNameKeyboard(addStepPayload.scenarioId),
    });
  }

  if (!(await scenariosManager.isStepNameAllowed(addStepPayload.scenarioId, name))) {
    return new MessageAction({
      content: {
        type: 'text',
        text: 'Название сценария должно быть уникальным',
      },
      replyMarkup: getAddScenarioSetNameKeyboard(addStepPayload.scenarioId),
    });
  }

  const newPayload: AddScenarioStepPayload = {
    ...addStepPayload,
    name,
  };

  await userDataProvider.setUserData(user.id, {
    ...user.data,
    state: TelegramUserState.AddScenarioStepSetType,
    addScenarioStepPayload: newPayload,
  });

  return getAddScenarioTypeSetTypeAction(newPayload);
});

function getAddScenarioSetNameKeyboard(currentScenarioId: number): InlineKeyboard {
  return [
    [
      backToCallbackButton('К шагам', {
        type: ScenariosManagerCallbackButtonType.OpenScenarioSteps,
        scenarioId: currentScenarioId,
      }),
    ],
  ];
}
