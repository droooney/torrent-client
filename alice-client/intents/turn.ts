import aliceClient from 'alice-client/client';

import { IntentType } from 'alice-client/constants/intents';

import VoiceResponse from 'alice-client/utilities/VoiceResponse';
import CustomError, { ErrorCode } from 'utilities/CustomError';

aliceClient.handleIntent(IntentType.TURN_ON, async (ctx) => {
  const { device } = ctx.slots;

  if (device?.type !== 'YANDEX.STRING') {
    throw new CustomError(ErrorCode.UNSUPPORTED, 'Неизвестное устройство');
  }

  console.log(device);

  return new VoiceResponse({
    text: `Включаю ${device.value}`,
  });
});
