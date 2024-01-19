import aliceClient from 'alice-client/client';
import rutrackerClient from 'rutracker-client/client';

import { IntentType } from 'alice-client/constants/intents';
import { SECOND } from 'constants/date';

import CustomError, { ErrorCode } from 'utilities/CustomError';
import { runTask } from 'utilities/process';
import { delay } from 'utilities/promise';

const SEARCH_RUTRACKER_TIMEOUT = 3 * SECOND;

aliceClient.handleIntent(IntentType.DOWNLOAD, async (ctx) => {
  const { query, ultraHd, fullHd } = ctx.slots;

  if (query?.type !== 'YANDEX.STRING') {
    throw new CustomError(ErrorCode.WRONG_FORMAT, 'Запрос неверного формата');
  }

  const results = await Promise.race([
    rutrackerClient.search(`${query.value}${ultraHd ? ' 2160p' : fullHd ? ' 1080p' : ''}`),
    delay(SEARCH_RUTRACKER_TIMEOUT),
  ]);

  if (!results) {
    return 'Поиск занял слишком долгое время, попробуйте еще раз';
  }

  const firstResult = results.at(0);

  if (!firstResult) {
    return 'Результатов не найдено';
  }

  runTask(async () => {
    await rutrackerClient.addTorrent(firstResult.id);
  });

  return `Скачиваю ${query.value}${ultraHd ? ' в ультра эйчди' : ultraHd ? ' в фулл эйчди' : ''}`;
});
