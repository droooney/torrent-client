import { TelegramUserState } from '@prisma/client';
import { InlineKeyboard, Markdown, MessageResponse } from '@tg-sensei/bot';
import scenariosManager from 'scenarios-manager/manager';

import { AddScenarioStepPayload } from 'scenarios-manager/types/step';
import { ScenariosManagerCallbackButtonType } from 'telegram-bot/types/keyboard/scenarios-manager';

import ScenariosManager from 'scenarios-manager/utilities/ScenariosManager';
import { getAddStepPayload } from 'scenarios-manager/utilities/payload';
import { backToCallbackButton } from 'telegram-bot/utilities/keyboard';

import { callbackDataProvider, messageUserDataProvider } from 'telegram-bot/bot';
import { getAddScenarioStepSetTypeResponse } from 'telegram-bot/responses/scenarios-manager/scenarios/scenario/steps/addStep/setType';

callbackDataProvider.handle(ScenariosManagerCallbackButtonType.AddScenarioStepSetName, async (ctx) => {
  const {
    user,
    callbackData: { scenarioId, isBack },
  } = ctx;

  await user.updateData({
    state: TelegramUserState.AddScenarioStepSetName,
    addScenarioStepPayload: isBack
      ? user.data.addScenarioStepPayload
      : {
          ...ScenariosManager.defaultAddScenarioStepPayload,
          scenarioId,
        },
  });

  await ctx.respondWith(
    new MessageResponse({
      content: Markdown.italic('Введите название шага'),
      replyMarkup: await getAddScenarioStepSetNameKeyboard(scenarioId),
    }),
  );
});

messageUserDataProvider.handle(TelegramUserState.AddScenarioStepSetName, async (ctx) => {
  const { message, user } = ctx;
  const addStepPayload = getAddStepPayload(user.data.addScenarioStepPayload);
  const name = message.text;

  if (!name) {
    return ctx.respondWith(
      new MessageResponse({
        content: 'Название шага должно содержать как минимум 1 символ',
        replyMarkup: await getAddScenarioStepSetNameKeyboard(addStepPayload.scenarioId),
      }),
    );
  }

  if (!(await scenariosManager.isStepNameAllowed(addStepPayload.scenarioId, name))) {
    return ctx.respondWith(
      new MessageResponse({
        content: 'Название шага должно быть уникальным',
        replyMarkup: await getAddScenarioStepSetNameKeyboard(addStepPayload.scenarioId),
      }),
    );
  }

  const newPayload: AddScenarioStepPayload = {
    ...addStepPayload,
    name,
  };

  await user.updateData({
    state: TelegramUserState.AddScenarioStepSetType,
    addScenarioStepPayload: newPayload,
  });

  await ctx.respondWith(await getAddScenarioStepSetTypeResponse(newPayload));
});

async function getAddScenarioStepSetNameKeyboard(currentScenarioId: number): Promise<InlineKeyboard> {
  return callbackDataProvider.buildInlineKeyboard([
    [
      backToCallbackButton('К шагам', {
        type: ScenariosManagerCallbackButtonType.OpenScenarioSteps,
        scenarioId: currentScenarioId,
      }),
    ],
  ]);
}
