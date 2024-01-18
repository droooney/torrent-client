import aliceClient from 'alice-client/client';

import { CommandType } from 'alice-client/constants/commands';

import CustomError, { ErrorCode } from 'utilities/CustomError';

aliceClient.handleCommand(CommandType.DEVICE_TURN_ON, async (ctx) => {
  const { device } = ctx.slots;

  if (device?.type !== 'YANDEX.STRING') {
    throw new CustomError(ErrorCode.UNSUPPORTED, 'Неизвестное устройство');
  }

  console.log(device);

  return `Включаю ${device.value}`;
});
