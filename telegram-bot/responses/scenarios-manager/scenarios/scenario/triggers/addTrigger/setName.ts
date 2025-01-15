import { TelegramUserState } from '@prisma/client';
import { InlineKeyboard, Markdown, MessageResponse } from '@tg-sensei/bot';
import scenariosManager from 'scenarios-manager/manager';

import { AddScenarioTriggerPayload } from 'scenarios-manager/types/trigger';
import { ScenariosManagerCallbackButtonType } from 'telegram-bot/types/keyboard/scenarios-manager';

import ScenariosManager from 'scenarios-manager/utilities/ScenariosManager';
import { getAddTriggerPayload } from 'scenarios-manager/utilities/payload';
import { backToCallbackButton } from 'telegram-bot/utilities/keyboard';

import { callbackDataProvider, messageUserDataProvider } from 'telegram-bot/bot';
import { getAddScenarioTriggerSetTypeResponse } from 'telegram-bot/responses/scenarios-manager/scenarios/scenario/triggers/addTrigger/setType';

callbackDataProvider.handle(ScenariosManagerCallbackButtonType.AddScenarioTriggerSetName, async (ctx) => {
  const {
    user,
    callbackData: { scenarioId, isBack },
  } = ctx;

  await user.updateData({
    state: TelegramUserState.AddScenarioTriggerSetName,
    addScenarioTriggerPayload: isBack
      ? user.data.addScenarioTriggerPayload
      : {
          ...ScenariosManager.defaultAddScenarioTriggerPayload,
          scenarioId,
        },
  });

  await ctx.respondWith(
    new MessageResponse({
      content: Markdown.italic('Введите название триггера'),
      replyMarkup: await getAddScenarioTriggerSetNameKeyboard(scenarioId),
    }),
  );
});

messageUserDataProvider.handle(TelegramUserState.AddScenarioTriggerSetName, async (ctx) => {
  const { message, user } = ctx;
  const addTriggerPayload = getAddTriggerPayload(user.data.addScenarioTriggerPayload);
  const name = message.text;

  if (!name) {
    return ctx.respondWith(
      new MessageResponse({
        content: 'Название триггера должно содержать как минимум 1 символ',
        replyMarkup: await getAddScenarioTriggerSetNameKeyboard(addTriggerPayload.scenarioId),
      }),
    );
  }

  if (!(await scenariosManager.isTriggerNameAllowed(addTriggerPayload.scenarioId, name))) {
    return ctx.respondWith(
      new MessageResponse({
        content: 'Название триггера должно быть уникальным',
        replyMarkup: await getAddScenarioTriggerSetNameKeyboard(addTriggerPayload.scenarioId),
      }),
    );
  }

  const newPayload: AddScenarioTriggerPayload = {
    ...addTriggerPayload,
    name,
  };

  await user.updateData({
    state: TelegramUserState.AddScenarioTriggerSetType,
    addScenarioTriggerPayload: newPayload,
  });

  await ctx.respondWith(await getAddScenarioTriggerSetTypeResponse(newPayload));
});

async function getAddScenarioTriggerSetNameKeyboard(currentScenarioId: number): Promise<InlineKeyboard> {
  return callbackDataProvider.buildInlineKeyboard([
    [
      backToCallbackButton('К триггерам', {
        type: ScenariosManagerCallbackButtonType.OpenScenarioTriggers,
        scenarioId: currentScenarioId,
      }),
    ],
  ]);
}
