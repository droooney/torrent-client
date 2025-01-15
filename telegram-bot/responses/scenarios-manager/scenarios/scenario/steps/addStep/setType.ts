import { ScenarioStepType, TelegramUserState } from '@prisma/client';
import { Markdown, MessageResponse, Response } from '@tg-sensei/bot';
import chunk from 'lodash/chunk';

import { AddScenarioStepPayload, StepRunParams } from 'scenarios-manager/types/step';
import { ScenariosManagerCallbackButtonType } from 'telegram-bot/types/keyboard/scenarios-manager';

import { getAddStepPayload } from 'scenarios-manager/utilities/payload';
import { backToCallbackButton, callbackButton } from 'telegram-bot/utilities/keyboard';
import {
  formatScenarioStepEnteredFields,
  getScenarioStepTypeIcon,
  getScenarioStepTypeString,
} from 'telegram-bot/utilities/responses/scenarios-manager';
import CustomError, { ErrorCode } from 'utilities/CustomError';

import { callbackDataProvider, messageUserDataProvider } from 'telegram-bot/bot';
import { getAddScenarioStepSetDeviceResponse } from 'telegram-bot/responses/scenarios-manager/scenarios/scenario/steps/addStep/setDevice';
import { getAddScenarioStepSetScenarioResponse } from 'telegram-bot/responses/scenarios-manager/scenarios/scenario/steps/addStep/setScenario';
import { getAddScenarioStepSetWaitPeriodResponse } from 'telegram-bot/responses/scenarios-manager/scenarios/scenario/steps/addStep/setWaitPeriod';

callbackDataProvider.handle(ScenariosManagerCallbackButtonType.AddScenarioStepSetType, async (ctx) => {
  const { user } = ctx;

  await user.updateData({
    state: TelegramUserState.AddScenarioStepSetType,
  });

  await ctx.respondWith(await getAddScenarioStepSetTypeResponse(getAddStepPayload(user.data.addScenarioStepPayload)));
});

callbackDataProvider.handle(ScenariosManagerCallbackButtonType.AddScenarioStepType, async (ctx) => {
  const {
    user,
    callbackData: { stepType },
  } = ctx;
  let runParams: StepRunParams;
  let newState: TelegramUserState;

  if (stepType === ScenarioStepType.RunScenario) {
    runParams = {
      type: ScenarioStepType.RunScenario,
      scenarioId: 0,
    };
    newState = TelegramUserState.AddScenarioStepSetScenario;
  } else if (stepType === ScenarioStepType.Wait) {
    runParams = {
      type: ScenarioStepType.Wait,
      period: 0,
    };
    newState = TelegramUserState.AddScenarioStepSetWaitPeriod;
  } else if (
    stepType === ScenarioStepType.TurnOnDevice ||
    stepType === ScenarioStepType.TurnOffDevice ||
    stepType === ScenarioStepType.ToggleDevice
  ) {
    runParams = {
      type: stepType,
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

  await user.updateData({
    state: newState,
    addScenarioStepPayload: newPayload,
  });

  let nextResponse: Response;

  if (stepType === ScenarioStepType.RunScenario) {
    nextResponse = getAddScenarioStepSetScenarioResponse(newPayload.scenarioId);
  } else if (stepType === ScenarioStepType.Wait) {
    nextResponse = await getAddScenarioStepSetWaitPeriodResponse(newPayload.scenarioId);
  } else {
    nextResponse = getAddScenarioStepSetDeviceResponse(newPayload.scenarioId);
  }

  await ctx.respondWith(nextResponse);
});

messageUserDataProvider.handle(TelegramUserState.AddScenarioStepSetType, async (ctx) => {
  const { user } = ctx;

  await ctx.respondWith(await getAddScenarioStepSetTypeResponse(getAddStepPayload(user.data.addScenarioStepPayload)));
});

export async function getAddScenarioStepSetTypeResponse(
  addScenarioStepPayload: AddScenarioStepPayload,
): Promise<MessageResponse> {
  return new MessageResponse({
    content: Markdown.create`${formatScenarioStepEnteredFields(addScenarioStepPayload, ['name'])}


${Markdown.italic('Выберите тип шага')}`,
    replyMarkup: await callbackDataProvider.buildInlineKeyboard([
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
    ]),
  });
}
