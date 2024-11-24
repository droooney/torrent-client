import { Device, TelegramUserState } from '@prisma/client';
import { InlineKeyboard, Markdown, MessageResponse, ResponsesStreamResponse } from '@tg-sensei/bot';
import devicesClient from 'devices-client/client';

import { SECOND } from 'constants/date';

import { AddDevicePayload } from 'devices-client/types/device';
import { DevicesClientCallbackButtonType } from 'telegram-bot/types/keyboard/devices-client';

import MatterClient from 'devices-client/utilities/MatterClient';
import { getAddDevicePayload } from 'devices-client/utilities/payload';
import { backToCallbackButton } from 'telegram-bot/utilities/keyboard';
import { formatDeviceEnteredFields } from 'telegram-bot/utilities/responses/devices-client';
import CustomError, { ErrorCode } from 'utilities/CustomError';
import { isDefined } from 'utilities/is';

import { callbackDataProvider, messageUserDataProvider } from 'telegram-bot/bot';
import { getDeviceResponse } from 'telegram-bot/responses/devices-client/devices/device/status';

messageUserDataProvider.handle(TelegramUserState.AddDeviceEnterMatterPairingCode, async (ctx) => {
  const { message, user } = ctx;
  let matterPairingCode: string | null = message.text ?? '';

  if (matterPairingCode === '-') {
    matterPairingCode = null;
  }

  let matterNodeId: bigint | null = null;
  let device: Device;

  try {
    if (isDefined(matterPairingCode)) {
      try {
        MatterClient.parsePairingCode(matterPairingCode);
      } catch (err) {
        throw new CustomError(ErrorCode.WRONG_MATTER_PAIRING_CODE, 'Неверный код', {
          cause: err,
        });
      }

      await ctx.respondWith(
        new MessageResponse({
          content: 'Запущен процесс подключения устройства. Ожидайте...',
        }),
      );

      matterNodeId = await devicesClient.commissionMatterDevice(matterPairingCode);
    }

    device = await devicesClient.addDevice({
      ...getAddDevicePayload(user.data.addDevicePayload),
      matterNodeId,
    });
  } catch (err) {
    if (matterNodeId) {
      await devicesClient.decommissionMatterDevice(matterNodeId);
    }

    throw err;
  }

  await user.updateData({
    state: TelegramUserState.Waiting,
    addDevicePayload: null,
  });

  await ctx.respondWith(
    new ResponsesStreamResponse(async function* () {
      yield new MessageResponse({
        content: 'Устройство добавлено!',
      });

      yield getDeviceResponse(device.id, {
        timeout: SECOND,
      });
    }),
  );
});

export async function getAddDeviceSetMatterPairingCodeResponse(
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


${Markdown.italic(
  'Если это устройство Matter, введите Matter код устройства (11 или 21 цифр). Вбейте "-", чтобы пропустить',
)}`,
    replyMarkup: await getSetMatterPairingCodeKeyboard(),
  });
}

async function getSetMatterPairingCodeKeyboard(): Promise<InlineKeyboard> {
  return callbackDataProvider.buildInlineKeyboard([
    [
      backToCallbackButton('К вводу адреса', {
        type: DevicesClientCallbackButtonType.AddDeviceSetAddress,
      }),
    ],
    [
      backToCallbackButton('К устройствам', {
        type: DevicesClientCallbackButtonType.OpenStatus,
      }),
    ],
  ]);
}
