import { Device, ScenarioTriggerType } from '@prisma/client';
import { Markdown, MessageResponse, ResponsesStreamResponse } from '@tg-sensei/bot';
import scenariosManager from 'scenarios-manager/manager';

import { getPaginationInfo } from 'db/utilities/pagination';

import { ScenariosManagerCallbackButtonType } from 'telegram-bot/types/keyboard/scenarios-manager';

import { getAddTriggerPayload } from 'scenarios-manager/utilities/payload';
import { callbackButton, refreshCallbackButton } from 'telegram-bot/utilities/keyboard';
import PaginationMessageResponse from 'telegram-bot/utilities/responses/PaginationMessageResponse';
import { formatDevice, getDeviceIcon } from 'telegram-bot/utilities/responses/devices-client';
import { getBackToAddTriggerSetTypeKeyboardButtons } from 'telegram-bot/utilities/responses/scenarios-manager';
import CustomError, { ErrorCode } from 'utilities/CustomError';

import { callbackDataProvider } from 'telegram-bot/bot';
import { getScenarioTriggerResponse } from 'telegram-bot/responses/scenarios-manager/scenarios/scenario/triggers/item';

callbackDataProvider.handle(ScenariosManagerCallbackButtonType.AddScenarioTriggerDevicesList, async (ctx) => {
  const {
    user,
    callbackData: { page },
  } = ctx;
  const addTriggerPayload = getAddTriggerPayload(user.data.addScenarioTriggerPayload);

  await ctx.respondWith(getAddScenarioTriggerSetDeviceResponse(addTriggerPayload.scenarioId, page));
});

callbackDataProvider.handle(ScenariosManagerCallbackButtonType.AddScenarioTriggerDevice, async (ctx) => {
  const {
    user,
    callbackData: { deviceId },
  } = ctx;
  const addTriggerPayload = getAddTriggerPayload(user.data.addScenarioTriggerPayload);

  if (
    addTriggerPayload.params.type !== ScenarioTriggerType.DeviceOnline &&
    addTriggerPayload.params.type !== ScenarioTriggerType.DeviceOffline &&
    addTriggerPayload.params.type !== ScenarioTriggerType.DevicePowerOn &&
    addTriggerPayload.params.type !== ScenarioTriggerType.DevicePowerOff
  ) {
    throw new CustomError(ErrorCode.UNSUPPORTED, 'Неизвестное действие');
  }

  const trigger = await scenariosManager.addScenarioTrigger({
    ...addTriggerPayload,
    params: {
      ...addTriggerPayload.params,
      deviceId,
    },
  });

  await ctx.respondWith(
    new ResponsesStreamResponse(async function* () {
      yield new MessageResponse({
        content: 'Триггер добавлен!',
      });

      yield getScenarioTriggerResponse(trigger.id, {
        mode: 'separate',
      });
    }),
  );
});

export function getAddScenarioTriggerSetDeviceResponse(
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
      type: ScenariosManagerCallbackButtonType.AddScenarioTriggerDevicesList,
      page,
    }),
    getItemButton: (device) =>
      callbackButton(getDeviceIcon(device.type), device.name, {
        type: ScenariosManagerCallbackButtonType.AddScenarioTriggerDevice,
        deviceId: device.id,
      }),
    getItemText: (device) => formatDevice(device),
    getKeyboard: (paginationButtons) => [
      [
        refreshCallbackButton({
          type: ScenariosManagerCallbackButtonType.AddScenarioTriggerDevicesList,
          page,
          isRefresh: true,
        }),
      ],
      ...paginationButtons,
      ...getBackToAddTriggerSetTypeKeyboardButtons(currentScenarioId),
    ],
  });
}
