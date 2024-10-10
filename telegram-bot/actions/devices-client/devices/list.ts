import { Device } from '@prisma/client';
import { Markdown } from '@tg-sensei/bot';

import { getPaginationInfo } from 'db/utilities/pagination';

import { DevicesClientCallbackButtonType } from 'telegram-bot/types/keyboard/devices-client';

import PaginationMessageAction from 'telegram-bot/utilities/actions/PaginationMessageAction';
import RefreshDataAction from 'telegram-bot/utilities/actions/RefreshDataAction';
import { formatDevice, getDeviceIcon } from 'telegram-bot/utilities/actions/devices-client';
import { backCallbackButton, callbackButton, refreshCallbackButton } from 'telegram-bot/utilities/keyboard';

import { callbackDataProvider } from 'telegram-bot/bot';

callbackDataProvider.handle(DevicesClientCallbackButtonType.OpenDevicesList, async ({ data }) => {
  return getDevicesListAction(data.page);
});

callbackDataProvider.handle(DevicesClientCallbackButtonType.RefreshDevicesList, async ({ data }) => {
  return new RefreshDataAction(await getDevicesListAction(data.page));
});

export async function getDevicesListAction(page: number = 0): Promise<PaginationMessageAction<Device>> {
  return new PaginationMessageAction({
    page,
    emptyPageText: Markdown.italic('Нет устройств'),
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
      type: DevicesClientCallbackButtonType.OpenDevicesList,
      page,
    }),
    getItemButton: (device) =>
      callbackButton(getDeviceIcon(device.type), device.name, {
        type: DevicesClientCallbackButtonType.OpenDevice,
        deviceId: device.id,
      }),
    getItemText: (device) => formatDevice(device),
    getKeyboard: (paginationButtons) => [
      [
        refreshCallbackButton({
          type: DevicesClientCallbackButtonType.RefreshDevicesList,
          page,
        }),
      ],
      ...paginationButtons,
      [
        backCallbackButton({
          type: DevicesClientCallbackButtonType.OpenStatus,
        }),
      ],
    ],
  });
}
