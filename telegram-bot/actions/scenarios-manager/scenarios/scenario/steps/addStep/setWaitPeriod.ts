import { ScenarioStepType, TelegramUserState } from '@prisma/client';
import scenariosManager from 'scenarios-manager/manager';

import { SECOND } from 'constants/date';

import { ActionsStreamAction, MessageAction } from 'telegram-bot/types/actions';
import { InlineKeyboard } from 'telegram-bot/types/keyboard';
import { ScenariosManagerCallbackButtonType } from 'telegram-bot/types/keyboard/scenarios-manager';

import { getAddStepPayload } from 'scenarios-manager/utilities/payload';
import { backToCallbackButton } from 'telegram-bot/utilities/keyboard';
import CustomError, { ErrorCode } from 'utilities/CustomError';

import { getScenarioStepAction } from 'telegram-bot/actions/scenarios-manager/scenarios/scenario/steps/item';
import { userDataProvider } from 'telegram-bot/bot';

userDataProvider.handle(TelegramUserState.AddScenarioStepSetWaitPeriod, async ({ message, user }) => {
  const addStepPayload = getAddStepPayload(user.data.addScenarioStepPayload);

  if (addStepPayload.runParams.type !== ScenarioStepType.Wait) {
    throw new CustomError(ErrorCode.UNSUPPORTED, 'Неизвестное действие');
  }

  const waitPeriod = Number(message.text);

  if (Number.isNaN(waitPeriod) || waitPeriod <= 0) {
    return new MessageAction({
      content: {
        type: 'text',
        text: 'Время ожидания должно быть положительным числом',
      },
      replyMarkup: getSetWaitPeriodKeyboard(addStepPayload.scenarioId),
    });
  }

  const scenarioStep = await scenariosManager.addScenarioStep({
    ...addStepPayload,
    runParams: {
      ...addStepPayload.runParams,
      period: waitPeriod * SECOND,
    },
  });

  return new ActionsStreamAction(async function* () {
    yield new MessageAction({
      content: {
        type: 'text',
        text: 'Шаг добавлен!',
      },
    });

    yield getScenarioStepAction(scenarioStep.id);
  });
});

function getSetWaitPeriodKeyboard(currentScenarioId: number): InlineKeyboard {
  return [
    [
      backToCallbackButton('К выбору типа', {
        type: ScenariosManagerCallbackButtonType.AddScenarioStepSetType,
      }),
    ],
    [
      backToCallbackButton('К шагам', {
        type: ScenariosManagerCallbackButtonType.OpenScenarioSteps,
        scenarioId: currentScenarioId,
      }),
    ],
  ];
}

export function getAddScenarioSetWaitPeriodAction(currentScenarioId: number): MessageAction {
  return new MessageAction({
    content: {
      type: 'text',
      text: 'Введите время ожидания в секундах',
    },
    replyMarkup: getSetWaitPeriodKeyboard(currentScenarioId),
  });
}
