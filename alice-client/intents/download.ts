import aliceClient from 'alice-client/client';
import rutrackerClient from 'rutracker-client/client';

import { IntentType } from 'alice-client/constants/intents';
import { SECOND } from 'constants/date';

import VoiceResponse from 'alice-client/utilities/VoiceResponse';
import VoicedText from 'alice-client/utilities/VoicedText';
import CustomError, { ErrorCode } from 'utilities/CustomError';
import { runTask } from 'utilities/process';
import { timed } from 'utilities/promise';

const SEARCH_RUTRACKER_TIMEOUT = 4 * SECOND;

aliceClient.handleIntent(IntentType.DOWNLOAD, async (ctx) => {
  const { query, ultraHd, fullHd } = ctx.slots;

  if (query?.type !== 'YANDEX.STRING') {
    throw new CustomError(ErrorCode.WRONG_FORMAT, 'Неверный формат запроса');
  }

  const results = await timed(SEARCH_RUTRACKER_TIMEOUT, () =>
    rutrackerClient.search(`${query.value}${ultraHd ? ' 2160p' : fullHd ? ' 1080p' : ''}`),
  );

  if (!results) {
    throw new CustomError(ErrorCode.TIMEOUT, 'Поиск занял слишком долгое время, попробуйте еще раз');
  }

  const firstResult = results.at(0);

  if (!firstResult) {
    return new VoiceResponse({
      text: 'Результатов не найдено',
    });
  }

  runTask(async () => {
    await rutrackerClient.addTorrent(firstResult.id);
  });

  return new VoiceResponse({
    text: VoicedText.create`Скачиваю ${query.value}${
      ultraHd
        ? VoicedText.textTts(' в 4K', ' в 4 к+а')
        : fullHd
          ? VoicedText.textTts(' в FullHD', ' в фулл эйчд+и')
          : ''
    }`,
  });
});
