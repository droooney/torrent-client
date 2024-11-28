import aliceClient from 'alice-client/client';
import devicesClient from 'devices-client/client';

import { IntentType } from 'alice-client/constants/intents';

import VoiceResponse from 'alice-client/utilities/VoiceResponse';
import CustomError, { ErrorCode } from 'utilities/CustomError';
import { runTask } from 'utilities/process';

aliceClient.handleIntent(IntentType.TurnOn, async ({ slots }) => {
  const { target } = slots;

  if (target?.type !== 'YANDEX.STRING') {
    throw new CustomError(ErrorCode.UNSUPPORTED, 'Неизвестное устройство');
  }

  const device = await devicesClient.findDevice(target.value);

  runTask(async () => {
    await devicesClient.turnOnDevice(device.id);
  });

  return new VoiceResponse({
    text: `Включаю ${device.name}`,
  });
});

aliceClient.handleIntent(IntentType.TurnOff, async ({ slots }) => {
  const { target } = slots;

  if (target?.type !== 'YANDEX.STRING') {
    throw new CustomError(ErrorCode.UNSUPPORTED, 'Неизвестное устройство');
  }

  const device = await devicesClient.findDevice(target.value);

  runTask(async () => {
    await devicesClient.turnOffDevice(device.id);
  });

  return new VoiceResponse({
    text: `Выключаю ${device.name}`,
  });
});

aliceClient.handleIntent(IntentType.Toggle, async ({ slots }) => {
  const { target } = slots;

  if (target?.type !== 'YANDEX.STRING') {
    throw new CustomError(ErrorCode.UNSUPPORTED, 'Неизвестное устройство');
  }

  const device = await devicesClient.findDevice(target.value);

  runTask(async () => {
    await devicesClient.toggleDevicePower(device.id);
  });

  return new VoiceResponse({
    text: `Переключаю ${device.name}`,
  });
});
