import { ScenarioStepType, TelegramUserState } from '@prisma/client';
import { MessageResponse, ResponsesStreamResponse } from '@tg-sensei/bot';
import scenariosManager from 'scenarios-manager/manager';

import { SECOND } from 'constants/date';

import { getAddStepPayload } from 'scenarios-manager/utilities/payload';
import { getBackToAddStepSetTypeKeyboard } from 'telegram-bot/utilities/responses/scenarios-manager';
import CustomError, { ErrorCode } from 'utilities/CustomError';

import { messageUserDataProvider } from 'telegram-bot/bot';
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
        replyMarkup: await getBackToAddStepSetTypeKeyboard(addStepPayload.scenarioId),
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

  await user.updateData({
    state: TelegramUserState.Waiting,
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

export async function getAddScenarioStepSetWaitPeriodResponse(currentScenarioId: number): Promise<MessageResponse> {
  return new MessageResponse({
    content: 'Введите время ожидания в секундах',
    replyMarkup: await getBackToAddStepSetTypeKeyboard(currentScenarioId),
  });
}
