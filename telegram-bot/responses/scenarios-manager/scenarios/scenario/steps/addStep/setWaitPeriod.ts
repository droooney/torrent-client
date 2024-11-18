import { ScenarioStepType, TelegramUserState } from '@prisma/client';
import { InlineKeyboard, MessageResponse, ResponsesStreamResponse } from '@tg-sensei/bot';
import scenariosManager from 'scenarios-manager/manager';

import { SECOND } from 'constants/date';

import { ScenariosManagerCallbackButtonType } from 'telegram-bot/types/keyboard/scenarios-manager';

import { getAddStepPayload } from 'scenarios-manager/utilities/payload';
import { backToCallbackButton } from 'telegram-bot/utilities/keyboard';
import CustomError, { ErrorCode } from 'utilities/CustomError';

import { callbackDataProvider, messageUserDataProvider } from 'telegram-bot/bot';
import { getScenarioStepResponse } from 'telegram-bot/responses/scenarios-manager/scenarios/scenario/steps/item';

messageUserDataProvider.handle(TelegramUserState.AddScenarioStepSetWaitPeriod, async (ctx) => {
  const { message, user } = ctx;
  const addStepPayload = getAddStepPayload(user.data.addScenarioStepPayload);

  if (addStepPayload.runParams.type !== ScenarioStepType.Wait) {
    throw new CustomError(ErrorCode.UNSUPPORTED, 'Неизвестное действие');
  }

  const waitPeriod = Number(message.text);

  if (Number.isNaN(waitPeriod) || waitPeriod <= 0) {
    return ctx.respondWith(
      new MessageResponse({
        content: 'Время ожидания должно быть положительным числом',
        replyMarkup: await getSetWaitPeriodKeyboard(addStepPayload.scenarioId),
      }),
    );
  }

  const scenarioStep = await scenariosManager.addScenarioStep({
    ...addStepPayload,
    runParams: {
      ...addStepPayload.runParams,
      period: waitPeriod * SECOND,
    },
  });

  await ctx.respondWith(
    new ResponsesStreamResponse(async function* () {
      yield new MessageResponse({
        content: 'Шаг добавлен!',
      });

      yield getScenarioStepResponse(scenarioStep.id);
    }),
  );
});

async function getSetWaitPeriodKeyboard(currentScenarioId: number): Promise<InlineKeyboard> {
  return callbackDataProvider.buildInlineKeyboard([
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
  ]);
}

export async function getAddScenarioSetWaitPeriodResponse(currentScenarioId: number): Promise<MessageResponse> {
  return new MessageResponse({
    content: 'Введите время ожидания в секундах',
    replyMarkup: await getSetWaitPeriodKeyboard(currentScenarioId),
  });
}
