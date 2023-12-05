import { Torrent, TorrentState } from '@prisma/client';
import groupBy from 'lodash/groupBy';
import map from 'lodash/map';
import sortBy from 'lodash/sortBy';
import torrentClient from 'torrent-client';

import prisma from 'db/prisma';

import { formatPercent } from 'utilities/number';
import { formatSpeed } from 'utilities/size';

const STATUS_STATE_SORTING: { [State in TorrentState]: number } = {
  Downloading: 0,
  Verifying: 1,
  Queued: 2,
  Paused: 3,
  Error: 4,
  Finished: 5,
};

const STATE_TITLE: { [State in TorrentState]: string } = {
  Downloading: '🟢 Скачиваются',
  Verifying: '🟡 Проверяются',
  Queued: '🔵 В очереди',
  Paused: '🟠 На паузе',
  Error: '🔴 Ошибка',
  Finished: '⚪️ Завершены',
};

export async function getTelegramStatus(): Promise<string> {
  const [client, clientState, notFinishedTorrents] = await Promise.all([
    torrentClient.clientPromise,
    torrentClient.getState(),
    prisma.torrent.findMany({
      where: {
        state: {
          notIn: ['Finished'],
        },
      },
    }),
  ]);

  let statusString = '';

  if (clientState.paused) {
    statusString += `🟠 Клиент стоит на паузе

`;
  }

  statusString += `Скорость загрузки: ${formatSpeed(client.downloadSpeed)}${
    clientState.downloadSpeedLimit === null ? '' : ` (ограничение: ${formatSpeed(clientState.downloadSpeedLimit)})`
  }
Скорость отдачи: ${formatSpeed(client.uploadSpeed)}${
    clientState.uploadSpeedLimit === null ? '' : ` (ограничение: ${formatSpeed(clientState.uploadSpeedLimit)})`
  }

`;

  const sortedTorrents = sortBy(notFinishedTorrents, ({ state }) => STATUS_STATE_SORTING[state]);
  const groupedTorrents = groupBy(sortedTorrents, ({ state }) => state);

  statusString +=
    map(groupedTorrents, (torrents, groupString) => {
      return `${STATE_TITLE[groupString as TorrentState]}
${torrents.map(formatTorrent).join('\n')}`;
    }).join('\n\n') || 'Нет активных торрентов';

  return statusString;
}

export function formatTorrent(torrent: Torrent): string {
  // TODO: show actual progress, show time remaining

  return `${torrent.name} (${formatPercent(torrent.progress)})`;
}
