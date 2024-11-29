import aliceClient from 'alice-client/client';
import scenariosManager from 'scenarios-manager/manager';

import { IntentType } from 'alice-client/constants/intents';

import VoiceResponse from 'alice-client/utilities/VoiceResponse';
import CustomError, { ErrorCode } from 'utilities/CustomError';
import { runTask } from 'utilities/process';

aliceClient.handleIntent(IntentType.Run, async ({ slots }) => {
  const { target } = slots;

  if (target?.type !== 'YANDEX.STRING') {
    throw new CustomError(ErrorCode.UNSUPPORTED, 'Неизвестный сценарий');
  }

  const scenario = await scenariosManager.findScenario(target.value);

  runTask(async () => {
    await scenariosManager.runScenario(scenario.id);
  });

  return new VoiceResponse({
    text: `Запускаю ${scenario.name}`,
  });
});
