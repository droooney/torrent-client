import { TelegramUserState } from '@prisma/client';
import { InlineKeyboard, Markdown, MessageResponse, ResponsesStreamResponse } from '@tg-sensei/bot';
import scenariosManager from 'scenarios-manager/manager';

import { ScenariosManagerCallbackButtonType } from 'telegram-bot/types/keyboard/scenarios-manager';

import { backToCallbackButton } from 'telegram-bot/utilities/keyboard';

import { callbackDataProvider, messageUserDataProvider } from 'telegram-bot/bot';
import { getScenarioResponse } from 'telegram-bot/responses/scenarios-manager/scenarios/scenario/item';

callbackDataProvider.handle(ScenariosManagerCallbackButtonType.AddScenario, async (ctx) => {
  const { user } = ctx;

  await user.updateData({
    state: TelegramUserState.AddScenarioSetName,
  });

  await ctx.respondWith(
    new MessageResponse({
      content: Markdown.italic('Введите название сценария'),
      replyMarkup: await getSetNameKeyboard(),
    }),
  );
});

messageUserDataProvider.handle(TelegramUserState.AddScenarioSetName, async (ctx) => {
  const {
    message: { text: name },
    user,
  } = ctx;

  if (!name) {
    return ctx.respondWith(
      new MessageResponse({
        content: 'Название сценария должно содержать как минимум 1 символ',
        replyMarkup: await getSetNameKeyboard(),
      }),
    );
  }

  if (!(await scenariosManager.isNameAllowed(name))) {
    return ctx.respondWith(
      new MessageResponse({
        content: 'Название сценария должно быть уникальным',
        replyMarkup: await getSetNameKeyboard(),
      }),
    );
  }

  const scenario = await scenariosManager.addScenario({
    name,
  });

  await user.updateData({
    state: TelegramUserState.Waiting,
  });

  await ctx.respondWith(
    new ResponsesStreamResponse(async function* () {
      yield new MessageResponse({
        content: 'Сценарий добавлен!',
      });

      yield getScenarioResponse(scenario.id);
    }),
  );
});

async function getSetNameKeyboard(): Promise<InlineKeyboard> {
  return callbackDataProvider.buildInlineKeyboard([
    [
      backToCallbackButton('К сценариям', {
        type: ScenariosManagerCallbackButtonType.OpenStatus,
      }),
    ],
  ]);
}
