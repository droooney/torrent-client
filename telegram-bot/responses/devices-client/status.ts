import { Markdown, MessageResponse } from '@tg-sensei/bot';
import devicesClient from 'devices-client/client';
import routerClient from 'router-client/client';

import { DevicesClientCallbackButtonType } from 'telegram-bot/types/keyboard/devices-client';
import { RootCallbackButtonType } from 'telegram-bot/types/keyboard/root';

import DevicesClient from 'devices-client/utilities/DevicesClient';
import {
  addCallbackButton,
  backCallbackButton,
  listCallbackButton,
  refreshCallbackButton,
} from 'telegram-bot/utilities/keyboard';
import { formatDeviceField } from 'telegram-bot/utilities/responses/devices-client';

import { callbackDataProvider } from 'telegram-bot/bot';

callbackDataProvider.handle(DevicesClientCallbackButtonType.OpenStatus, async (ctx) => {
  await ctx.respondWith(await getStatusResponse());
});

async function getStatusResponse(): Promise<MessageResponse> {
  const [knownDevices, routerDevices] = await Promise.all([devicesClient.getDevices(), routerClient.getDevices()]);

  const unknownDevices = routerDevices
    .filter(({ ip, mac }) => knownDevices.every((device) => device.address !== ip && device.mac !== mac))
    .map(DevicesClient.fromRouterDevice);

  return new MessageResponse({
    content:
      knownDevices.length === 0 && unknownDevices.length === 0
        ? Markdown.italic('Нет устройств')
        : Markdown.join(
            (
              [
                {
                  type: 'known',
                  devices: knownDevices,
                },
                {
                  type: 'unknown',
                  devices: unknownDevices,
                },
              ] as const
            ).map(
              ({ type, devices }) =>
                Markdown.create`${Markdown.bold(type === 'known' ? 'Известные устройства' : 'Неизвестные устройства')}

${Markdown.join(
  devices.map((device) => {
    const routerDevice = routerDevices.find(({ ip, mac }) => device.address === ip || device.mac === mac);
    const active = routerDevice?.active ?? false;

    return Markdown.join(
      [
        formatDeviceField('name', device.name),
        Markdown.create`${active ? '🟢' : '🔴'} ${Markdown.bold('Статус')}: ${active ? 'Онлайн' : 'Оффлайн'}`,
        ...(type === 'known' ? [formatDeviceField('type', device.type)] : []),
      ],
      '\n',
    );
  }),
  '\n\n',
)}`,
            ),
            '\n\n\n',
          ),
    replyMarkup: await callbackDataProvider.buildInlineKeyboard([
      [
        refreshCallbackButton({
          type: DevicesClientCallbackButtonType.OpenStatus,
          isRefresh: true,
        }),
        addCallbackButton({
          type: DevicesClientCallbackButtonType.AddDeviceSetName,
        }),
      ],
      [
        listCallbackButton({
          type: DevicesClientCallbackButtonType.OpenDevicesList,
        }),
      ],
      [
        backCallbackButton({
          type: RootCallbackButtonType.OpenRoot,
        }),
      ],
    ]),
  });
}
