import { ScenarioStepType, TelegramUserState } from '@prisma/client';
import { Markdown } from '@tg-sensei/bot';
import chunk from 'lodash/chunk';

import { AddScenarioStepPayload, StepRunParams } from 'scenarios-manager/types/step';
import { MessageAction } from 'telegram-bot/types/actions';
import { ScenariosManagerCallbackButtonType } from 'telegram-bot/types/keyboard/scenarios-manager';

import { getAddStepPayload } from 'scenarios-manager/utilities/payload';
import PaginationMessageAction from 'telegram-bot/utilities/actions/PaginationMessageAction';
import {
  formatScenarioStepEnteredFields,
  getScenarioStepTypeIcon,
  getScenarioStepTypeString,
} from 'telegram-bot/utilities/actions/scenarios-manager';
import { backToCallbackButton, callbackButton } from 'telegram-bot/utilities/keyboard';
import CustomError, { ErrorCode } from 'utilities/CustomError';

import { getAddScenarioSetDeviceAction } from 'telegram-bot/actions/scenarios-manager/scenarios/scenario/steps/addStep/setDevice';
import { getAddScenarioSetScenarioAction } from 'telegram-bot/actions/scenarios-manager/scenarios/scenario/steps/addStep/setScenario';
import { getAddScenarioSetWaitPeriodAction } from 'telegram-bot/actions/scenarios-manager/scenarios/scenario/steps/addStep/setWaitPeriod';
import { callbackDataProvider, userDataProvider } from 'telegram-bot/bot';

callbackDataProvider.handle(ScenariosManagerCallbackButtonType.AddScenarioStepSetType, async ({ user }) => {
  await userDataProvider.setUserData(user.id, {
    ...user.data,
    state: TelegramUserState.AddScenarioStepSetType,
  });

  return getAddScenarioTypeSetTypeAction(getAddStepPayload(user.data.addScenarioStepPayload));
});

callbackDataProvider.handle(ScenariosManagerCallbackButtonType.AddScenarioStepType, async ({ data, user }) => {
  let runParams: StepRunParams;
  let newState: TelegramUserState;

  if (data.stepType === ScenarioStepType.RunScenario) {
    runParams = {
      type: ScenarioStepType.RunScenario,
      scenarioId: 0,
    };
    newState = TelegramUserState.AddScenarioStepSetScenario;
  } else if (data.stepType === ScenarioStepType.Wait) {
    runParams = {
      type: ScenarioStepType.Wait,
      period: 0,
    };
    newState = TelegramUserState.AddScenarioStepSetWaitPeriod;
  } else if (data.stepType === ScenarioStepType.TurnOnDevice || data.stepType === ScenarioStepType.TurnOffDevice) {
    runParams = {
      type: data.stepType,
      deviceId: 0,
    };
    newState = TelegramUserState.AddScenarioStepSetDevice;
  } else {
    throw new CustomError(ErrorCode.UNSUPPORTED, 'Неизвестный тип шага');
  }

  const newPayload: AddScenarioStepPayload = {
    ...getAddStepPayload(user.data.addScenarioStepPayload),
    runParams,
  };

  await userDataProvider.setUserData(user.id, {
    ...user.data,
    state: newState,
    addScenarioStepPayload: newPayload,
  });

  let nextAction: MessageAction | PaginationMessageAction<any>;

  if (data.stepType === ScenarioStepType.RunScenario) {
    nextAction = getAddScenarioSetScenarioAction(newPayload.scenarioId);
  } else if (data.stepType === ScenarioStepType.Wait) {
    nextAction = getAddScenarioSetWaitPeriodAction(newPayload.scenarioId);
  } else {
    nextAction = getAddScenarioSetDeviceAction(newPayload.scenarioId);
  }

  return nextAction;
});

userDataProvider.handle(TelegramUserState.AddScenarioStepSetType, async ({ user }) => {
  return getAddScenarioTypeSetTypeAction(getAddStepPayload(user.data.addScenarioStepPayload));
});

export function getAddScenarioTypeSetTypeAction(addScenarioStepPayload: AddScenarioStepPayload): MessageAction {
  return new MessageAction({
    content: {
      type: 'text',
      text: Markdown.create`${formatScenarioStepEnteredFields(addScenarioStepPayload, ['name'])}


${Markdown.italic('Выберите тип сценария')}`,
    },
    replyMarkup: [
      ...chunk(
        [
          ...Object.values(ScenarioStepType).map((stepType) =>
            callbackButton(getScenarioStepTypeIcon(stepType), getScenarioStepTypeString(stepType), {
              type: ScenariosManagerCallbackButtonType.AddScenarioStepType,
              stepType,
            }),
          ),
        ],
        2,
      ),
      [
        backToCallbackButton('К выбору названия', {
          type: ScenariosManagerCallbackButtonType.AddScenarioStepSetName,
          scenarioId: addScenarioStepPayload.scenarioId,
          isBack: true,
        }),
      ],
      [
        backToCallbackButton('К шагам', {
          type: ScenariosManagerCallbackButtonType.OpenScenarioSteps,
          scenarioId: addScenarioStepPayload.scenarioId,
        }),
      ],
    ],
  });
}
