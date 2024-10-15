import { Device, ScenarioStepType } from '@prisma/client';
import { Markdown } from '@tg-sensei/bot';
import scenariosManager from 'scenarios-manager/manager';

import { getPaginationInfo } from 'db/utilities/pagination';

import { ActionsStreamAction, MessageAction } from 'telegram-bot/types/actions';
import { ScenariosManagerCallbackButtonType } from 'telegram-bot/types/keyboard/scenarios-manager';

import { getAddStepPayload } from 'scenarios-manager/utilities/payload';
import PaginationMessageAction from 'telegram-bot/utilities/actions/PaginationMessageAction';
import RefreshDataAction from 'telegram-bot/utilities/actions/RefreshDataAction';
import { formatDevice, getDeviceIcon } from 'telegram-bot/utilities/actions/devices-client';
import { backToCallbackButton, callbackButton, refreshCallbackButton } from 'telegram-bot/utilities/keyboard';
import CustomError, { ErrorCode } from 'utilities/CustomError';

import { getScenarioStepAction } from 'telegram-bot/actions/scenarios-manager/scenarios/scenario/steps/item';
import { callbackDataProvider } from 'telegram-bot/bot';

callbackDataProvider.handle(ScenariosManagerCallbackButtonType.AddScenarioStepDevicesList, async ({ data, user }) => {
  const addStepPayload = getAddStepPayload(user.data.addScenarioStepPayload);
  const action = getAddScenarioSetDeviceAction(addStepPayload.scenarioId, data.page);

  return data.isRefresh ? new RefreshDataAction(action) : action;
});

callbackDataProvider.handle(ScenariosManagerCallbackButtonType.AddScenarioStepDevice, async ({ data, user }) => {
  const addStepPayload = getAddStepPayload(user.data.addScenarioStepPayload);

  if (
    addStepPayload.runParams.type !== ScenarioStepType.TurnOnDevice &&
    addStepPayload.runParams.type !== ScenarioStepType.TurnOffDevice
  ) {
    throw new CustomError(ErrorCode.UNSUPPORTED, 'Неизвестное действие');
  }

  const scenarioStep = await scenariosManager.addScenarioStep({
    ...addStepPayload,
    runParams: {
      ...addStepPayload.runParams,
      deviceId: data.deviceId,
    },
  });

  return new ActionsStreamAction(async function* () {
    yield new MessageAction({
      content: {
        type: 'text',
        text: 'Шаг добавлен!',
      },
    });

    yield getScenarioStepAction(scenarioStep.id, {
      mode: 'separate',
    });
  });
});

export function getAddScenarioSetDeviceAction(
  currentScenarioId: number,
  page: number = 0,
): PaginationMessageAction<Device> {
  return new PaginationMessageAction({
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
