import { Markdown, MessageResponse } from '@tg-sensei/bot';
import devicesClient from 'devices-client/client';

import { DevicesClientCallbackButtonType } from 'telegram-bot/types/keyboard/devices-client';
import { RootCallbackButtonType } from 'telegram-bot/types/keyboard/root';

import {
  addCallbackButton,
  backCallbackButton,
  listCallbackButton,
  refreshCallbackButton,
} from 'telegram-bot/utilities/keyboard';
import { formatDeviceField, formatDeviceStateFields } from 'telegram-bot/utilities/responses/devices-client';

import { callbackDataProvider } from 'telegram-bot/bot';

callbackDataProvider.handle(DevicesClientCallbackButtonType.OpenStatus, async (ctx) => {
  await ctx.respondWith(await getStatusResponse());
});

async function getStatusResponse(): Promise<MessageResponse> {
  const onlineDevicesInfo = await devicesClient.getOnlineDevicesInfo();

  return new MessageResponse({
    content:
      onlineDevicesInfo.length === 0
        ? Markdown.italic('Нет устройств онлайн')
        : Markdown.create`${Markdown.bold('📺 Устройства онлайн')}

${Markdown.join(
  onlineDevicesInfo.map((deviceInfo) => {
    return Markdown.join(
      [
        formatDeviceField('name', deviceInfo.name),
        formatDeviceStateFields(deviceInfo.state, ['power']),
        formatDeviceField('type', deviceInfo.type),
      ],
      '\n',
    );
  }),
  '\n\n',
)}`,
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
