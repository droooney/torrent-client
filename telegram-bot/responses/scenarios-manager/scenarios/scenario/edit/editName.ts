import { TelegramUserState } from '@prisma/client';
import { MessageResponse, ResponsesStreamResponse } from '@tg-sensei/bot';
import scenariosManager from 'scenarios-manager/manager';

import { EditScenarioPayload } from 'scenarios-manager/types/scenario';
import { ScenariosManagerCallbackButtonType } from 'telegram-bot/types/keyboard/scenarios-manager';

import { getEditScenarioPayload } from 'scenarios-manager/utilities/payload';
import { getBackToEditScenarioKeyboard } from 'telegram-bot/utilities/responses/scenarios-manager';

import { callbackDataProvider, messageUserDataProvider } from 'telegram-bot/bot';
import { getEditScenarioResponse } from 'telegram-bot/responses/scenarios-manager/scenarios/scenario/edit/root';

callbackDataProvider.handle(ScenariosManagerCallbackButtonType.EditScenarioName, async (ctx) => {
  const {
    user,
    callbackData: { scenarioId },
  } = ctx;
  const newPayload: EditScenarioPayload = {
    scenarioId,
  };

  await user.updateData({
    state: TelegramUserState.EditScenarioName,
    editScenarioPayload: newPayload,
  });

  await ctx.respondWith(
    new MessageResponse({
      content: 'Введите новое название',
      replyMarkup: await getBackToEditScenarioKeyboard(scenarioId),
    }),
  );
});

messageUserDataProvider.handle(TelegramUserState.EditScenarioName, async (ctx) => {
  const { message, user } = ctx;
  const editScenarioPayload = getEditScenarioPayload(user.data.editScenarioPayload);

  if (!editScenarioPayload) {
    return;
  }

  const { scenarioId } = editScenarioPayload;
  const name = message.text;

  if (!name) {
    return ctx.respondWith(
      new MessageResponse({
        content: 'Название сценария должно содержать как минимум 1 символ',
        replyMarkup: await getBackToEditScenarioKeyboard(scenarioId),
      }),
    );
  }

  if (!(await scenariosManager.isNameAllowed(name))) {
    return ctx.respondWith(
      new MessageResponse({
        content: 'Название сценария должно быть уникальным',
        replyMarkup: await getBackToEditScenarioKeyboard(scenarioId),
      }),
    );
  }

  await scenariosManager.editScenario(scenarioId, {
    name,
  });

  await user.updateData({
    state: TelegramUserState.Waiting,
    editScenarioPayload: null,
  });

  await ctx.respondWith(
    new ResponsesStreamResponse(async function* () {
      yield new MessageResponse({
        content: 'Название изменено',
      });

      yield getEditScenarioResponse(scenarioId);
    }),
  );
});
