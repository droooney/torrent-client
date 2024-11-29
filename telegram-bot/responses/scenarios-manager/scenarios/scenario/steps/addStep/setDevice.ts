import { Device, ScenarioStepType } from '@prisma/client';
import { Markdown, MessageResponse, ResponsesStreamResponse } from '@tg-sensei/bot';
import scenariosManager from 'scenarios-manager/manager';

import { getPaginationInfo } from 'db/utilities/pagination';

import { ScenariosManagerCallbackButtonType } from 'telegram-bot/types/keyboard/scenarios-manager';

import { getAddStepPayload } from 'scenarios-manager/utilities/payload';
import { backToCallbackButton, callbackButton, refreshCallbackButton } from 'telegram-bot/utilities/keyboard';
import PaginationMessageResponse from 'telegram-bot/utilities/responses/PaginationMessageResponse';
import { formatDevice, getDeviceIcon } from 'telegram-bot/utilities/responses/devices-client';
import CustomError, { ErrorCode } from 'utilities/CustomError';

import { callbackDataProvider } from 'telegram-bot/bot';
import { getScenarioStepResponse } from 'telegram-bot/responses/scenarios-manager/scenarios/scenario/steps/item';

callbackDataProvider.handle(ScenariosManagerCallbackButtonType.AddScenarioStepDevicesList, async (ctx) => {
  const {
    user,
    callbackData: { page },
  } = ctx;
  const addStepPayload = getAddStepPayload(user.data.addScenarioStepPayload);

  await ctx.respondWith(getAddScenarioSetDeviceResponse(addStepPayload.scenarioId, page));
});

callbackDataProvider.handle(ScenariosManagerCallbackButtonType.AddScenarioStepDevice, async (ctx) => {
  const {
    user,
    callbackData: { deviceId },
  } = ctx;
  const addStepPayload = getAddStepPayload(user.data.addScenarioStepPayload);

  if (
    addStepPayload.runParams.type !== ScenarioStepType.TurnOnDevice &&
    addStepPayload.runParams.type !== ScenarioStepType.TurnOffDevice &&
    addStepPayload.runParams.type !== ScenarioStepType.ToggleDevice
  ) {
    throw new CustomError(ErrorCode.UNSUPPORTED, 'Неизвестное действие');
  }

  const scenarioStep = await scenariosManager.addScenarioStep({
    ...addStepPayload,
    runParams: {
      ...addStepPayload.runParams,
      deviceId,
    },
  });

  await ctx.respondWith(
    new ResponsesStreamResponse(async function* () {
      yield new MessageResponse({
        content: 'Шаг добавлен!',
      });

      yield getScenarioStepResponse(scenarioStep.id, {
        mode: 'separate',
      });
    }),
  );
});

export function getAddScenarioSetDeviceResponse(
  currentScenarioId: number,
  page: number = 0,
): PaginationMessageResponse<Device> {
  return new PaginationMessageResponse({
    page,
    emptyPageText: Markdown.italic('Нет устройств'),
    getPageText: (pageText) => Markdown.create`${Markdown.italic('Выберите устройство')}


${pageText}`,
    getPageItemsInfo: async (options) =>
      getPaginationInfo({
        table: 'device',
        findOptions: {
          orderBy: {
            createdAt: 'asc',
          },
        },
        pagination: options,
      }),
    getPageButtonCallbackData: (page) => ({
      type: ScenariosManagerCallbackButtonType.AddScenarioStepDevicesList,
      page,
    }),
    getItemButton: (device) =>
      callbackButton(getDeviceIcon(device.type), device.name, {
        type: ScenariosManagerCallbackButtonType.AddScenarioStepDevice,
        deviceId: device.id,
      }),
    getItemText: (device) => formatDevice(device),
    getKeyboard: (paginationButtons) => [
      [
        refreshCallbackButton({
          type: ScenariosManagerCallbackButtonType.AddScenarioStepDevicesList,
          page,
          isRefresh: true,
        }),
      ],
      ...paginationButtons,
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
    ],
  });
}
