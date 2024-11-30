import { TelegramUserState } from '@prisma/client';
import { Markdown, MessageResponse } from '@tg-sensei/bot';

import { AddDevicePayload } from 'devices-client/types/device';
import { DevicesClientCallbackButtonType } from 'telegram-bot/types/keyboard/devices-client';

import { getAddDevicePayload } from 'devices-client/utilities/payload';
import { backToCallbackButton, callbackButton } from 'telegram-bot/utilities/keyboard';
import { formatDeviceEnteredFields } from 'telegram-bot/utilities/responses/devices-client';

import { callbackDataProvider, messageUserDataProvider } from 'telegram-bot/bot';
import { getAddDeviceSetMatterPairingCodeResponse } from 'telegram-bot/responses/devices-client/addDevice/setMatterPairingCode';

callbackDataProvider.handle(DevicesClientCallbackButtonType.AddDeviceSetUsedForAtHomeDetection, async (ctx) => {
  const { user } = ctx;

  await user.updateData({
    state: TelegramUserState.AddDeviceSetUsedForAtHomeDetection,
  });

  await ctx.respondWith(
    await getAddDeviceSetUsedForAtHomeDetectionResponse(getAddDevicePayload(user.data.addDevicePayload)),
  );
});

callbackDataProvider.handle(DevicesClientCallbackButtonType.AddDeviceUsedForAtHomeDetection, async (ctx) => {
  const {
    user,
    callbackData: { used },
  } = ctx;
  const newPayload: AddDevicePayload = {
    ...getAddDevicePayload(user.data.addDevicePayload),
    usedForAtHomeDetection: used,
  };

  await user.updateData({
    state: TelegramUserState.AddDeviceEnterMatterPairingCode,
    addDevicePayload: newPayload,
  });

  await ctx.respondWith(await getAddDeviceSetMatterPairingCodeResponse(newPayload));
});

messageUserDataProvider.handle(TelegramUserState.AddDeviceSetUsedForAtHomeDetection, async (ctx) => {
  const { user } = ctx;

  await ctx.respondWith(
    await getAddDeviceSetUsedForAtHomeDetectionResponse(getAddDevicePayload(user.data.addDevicePayload)),
  );
});

export async function getAddDeviceSetUsedForAtHomeDetectionResponse(
  addDevicePayload: AddDevicePayload,
): Promise<MessageResponse> {
  return new MessageResponse({
    content: Markdown.create`${formatDeviceEnteredFields(addDevicePayload, [
      'name',
      'type',
      'manufacturer',
      'mac',
      'address',
    ])}


${Markdown.italic('Используется для определения местоположения (есть ли кто-то дома или нет)')}`,
    replyMarkup: await callbackDataProvider.buildInlineKeyboard([
      [true, false].map((used) =>
        callbackButton('', used ? 'Да' : 'Нет', {
          type: DevicesClientCallbackButtonType.AddDeviceUsedForAtHomeDetection,
          used,
        }),
      ),
      [
        backToCallbackButton('К вводу IP-адреса', {
          type: DevicesClientCallbackButtonType.AddDeviceSetAddress,
        }),
      ],
      [
        backToCallbackButton('К устройствам', {
          type: DevicesClientCallbackButtonType.OpenStatus,
        }),
      ],
    ]),
  });
}
