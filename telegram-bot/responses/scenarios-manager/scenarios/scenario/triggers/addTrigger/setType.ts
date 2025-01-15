import { ScenarioTriggerType, TelegramUserState } from '@prisma/client';
import { Markdown, MessageResponse, Response, ResponsesStreamResponse } from '@tg-sensei/bot';
import chunk from 'lodash/chunk';
import scenariosManager from 'scenarios-manager/manager';

import { AddScenarioTriggerPayload, TriggerParams } from 'scenarios-manager/types/trigger';
import { ScenariosManagerCallbackButtonType } from 'telegram-bot/types/keyboard/scenarios-manager';

import { getAddTriggerPayload } from 'scenarios-manager/utilities/payload';
import { backToCallbackButton, callbackButton } from 'telegram-bot/utilities/keyboard';
import {
  formatScenarioTriggerEnteredFields,
  getScenarioTriggerTypeIcon,
  getScenarioTriggerTypeString,
} from 'telegram-bot/utilities/responses/scenarios-manager';
import CustomError, { ErrorCode } from 'utilities/CustomError';

import { callbackDataProvider, messageUserDataProvider } from 'telegram-bot/bot';
import { getAddScenarioTriggerSetDeviceResponse } from 'telegram-bot/responses/scenarios-manager/scenarios/scenario/triggers/addTrigger/setDevice';
import { getScenarioTriggerResponse } from 'telegram-bot/responses/scenarios-manager/scenarios/scenario/triggers/item';

callbackDataProvider.handle(ScenariosManagerCallbackButtonType.AddScenarioTriggerSetType, async (ctx) => {
  const { user } = ctx;

  await user.updateData({
    state: TelegramUserState.AddScenarioTriggerSetType,
  });

  await ctx.respondWith(
    await getAddScenarioTriggerSetTypeResponse(getAddTriggerPayload(user.data.addScenarioTriggerPayload)),
  );
});

callbackDataProvider.handle(ScenariosManagerCallbackButtonType.AddScenarioTriggerType, async (ctx) => {
  const {
    user,
    callbackData: { triggerType },
  } = ctx;
  let triggerParams: TriggerParams;
  let newState: TelegramUserState;

  if (triggerType === ScenarioTriggerType.EmptyHome || triggerType === ScenarioTriggerType.NonEmptyHome) {
    triggerParams = {
      type: triggerType,
    };
    newState = TelegramUserState.Waiting;
  } else if (
    triggerType === ScenarioTriggerType.DeviceOnline ||
    triggerType === ScenarioTriggerType.DeviceOffline ||
    triggerType === ScenarioTriggerType.DevicePowerOn ||
    triggerType === ScenarioTriggerType.DevicePowerOff
  ) {
    triggerParams = {
      type: triggerType,
      deviceId: 0,
    };
    newState = TelegramUserState.AddScenarioTriggerSetDevice;
  } else {
    throw new CustomError(ErrorCode.UNSUPPORTED, 'Неизвестный тип триггера');
  }

  const newPayload: AddScenarioTriggerPayload = {
    ...getAddTriggerPayload(user.data.addScenarioStepPayload),
    params: triggerParams,
  };

  await user.updateData({
    state: newState,
    addScenarioTriggerPayload: newPayload,
  });

  let nextResponse: Response;

  if (triggerType === ScenarioTriggerType.EmptyHome || triggerType === ScenarioTriggerType.NonEmptyHome) {
    const trigger = await scenariosManager.addScenarioTrigger(newPayload);

    nextResponse = new ResponsesStreamResponse(async function* () {
      yield new MessageResponse({
        content: 'Триггер добавлен!',
      });

      yield getScenarioTriggerResponse(trigger.id);
    });
  } else {
    nextResponse = getAddScenarioTriggerSetDeviceResponse(newPayload.scenarioId);
  }

  await ctx.respondWith(nextResponse);
});

messageUserDataProvider.handle(TelegramUserState.AddScenarioTriggerSetType, async (ctx) => {
  const { user } = ctx;

  await ctx.respondWith(
    await getAddScenarioTriggerSetTypeResponse(getAddTriggerPayload(user.data.addScenarioTriggerPayload)),
  );
});

export async function getAddScenarioTriggerSetTypeResponse(
  addScenarioTriggerPayload: AddScenarioTriggerPayload,
): Promise<MessageResponse> {
  return new MessageResponse({
    content: Markdown.create`${formatScenarioTriggerEnteredFields(addScenarioTriggerPayload, ['name'])}


${Markdown.italic('Выберите тип триггера')}`,
    replyMarkup: await callbackDataProvider.buildInlineKeyboard([
      ...chunk(
        [
          ...Object.values(ScenarioTriggerType).map((triggerType) =>
            callbackButton(getScenarioTriggerTypeIcon(triggerType), getScenarioTriggerTypeString(triggerType), {
              type: ScenariosManagerCallbackButtonType.AddScenarioTriggerType,
              triggerType,
            }),
          ),
        ],
        2,
      ),
      [
        backToCallbackButton('К выбору названия', {
          type: ScenariosManagerCallbackButtonType.AddScenarioTriggerSetName,
          scenarioId: addScenarioTriggerPayload.scenarioId,
          isBack: true,
        }),
      ],
      [
        backToCallbackButton('К триггерам', {
          type: ScenariosManagerCallbackButtonType.OpenScenarioTriggers,
          scenarioId: addScenarioTriggerPayload.scenarioId,
        }),
      ],
    ]),
  });
}
