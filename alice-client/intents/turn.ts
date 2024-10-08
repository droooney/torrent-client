import aliceClient from 'alice-client/client';
import devicesClient from 'devices-client/client';

import { IntentType } from 'alice-client/constants/intents';

import VoiceResponse from 'alice-client/utilities/VoiceResponse';
import CustomError, { ErrorCode } from 'utilities/CustomError';
import { runTask } from 'utilities/process';

aliceClient.handleIntent(IntentType.TURN_ON, async ({ slots }) => {
  const { target } = slots;

  if (target?.type !== 'YANDEX.STRING') {
    throw new CustomError(ErrorCode.UNSUPPORTED, 'Неизвестное устройство');
  }

  const device = await devicesClient.findDevice(target.value);

  if (!device) {
    throw new CustomError(ErrorCode.NOT_FOUND, 'Устройство не найдено');
  }

  runTask(async () => {
    await devicesClient.turnOnDevice(device.id);
  });

  return new VoiceResponse({
    text: `Включаю ${device.name}`,
  });
});

aliceClient.handleIntent(IntentType.TURN_OFF, async ({ slots }) => {
  const { target } = slots;

  if (target?.type !== 'YANDEX.STRING') {
    throw new CustomError(ErrorCode.UNSUPPORTED, 'Неизвестное устройство');
  }

  const device = await devicesClient.findDevice(target.value);

  if (!device) {
    throw new CustomError(ErrorCode.NOT_FOUND, 'Устройство не найдено');
  }

  runTask(async () => {
    await devicesClient.turnOffDevice(device.id);
  });

  return new VoiceResponse({
    text: `Выключаю ${device.name}`,
  });
});
