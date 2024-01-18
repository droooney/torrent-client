import aliceClient from 'alice-client/client';

import { IntentType } from 'alice-client/constants/intents';

import CustomError, { ErrorCode } from 'utilities/CustomError';

aliceClient.handleIntent(IntentType.DEVICE_TURN_ON, async (ctx) => {
  const { device } = ctx.slots;

  if (device?.type !== 'YANDEX.STRING') {
    throw new CustomError(ErrorCode.UNSUPPORTED, 'Неизвестное устройство');
  }

  console.log(device);

  return `Включаю ${device.value}`;
});
