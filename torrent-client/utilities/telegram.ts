import { Torrent, TorrentState } from '@prisma/client';
import groupBy from 'lodash/groupBy';
import map from 'lodash/map';
import sortBy from 'lodash/sortBy';
import { InlineKeyboardMarkup } from 'node-telegram-bot-api';
import torrentClient from 'torrent-client';

import prisma from 'db/prisma';

import { CallbackButtonSource } from 'types/telegram';

import CustomError from 'utilities/CustomError';
import { isDefined } from 'utilities/is';
import { formatPercent } from 'utilities/number';
import { formatSize, formatSpeed } from 'utilities/size';
import { prepareInlineKeyboard } from 'utilities/telegram';

const STATUS_STATE_SORTING: { [State in TorrentState]: number } = {
  Downloading: 0,
  Verifying: 1,
  Queued: 2,
  Paused: 3,
  Error: 4,
  Finished: 5,
};

const STATE_TITLE: { [State in TorrentState]: string } = {
  Downloading: '🟢 Скачивается',
  Verifying: '🟡 Проверяется',
  Queued: '🔵 В очереди',
  Paused: '🟠 На паузе',
  Error: '🔴 Ошибка',
  Finished: '⚪️ Завершен',
};

const LIST_PAGE_SIZE = 6;

// TODO: add keyboard (refresh status, settings, pause, set limits)
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

  statusString += formatTorrents(notFinishedTorrents) || 'Нет активных торрентов';

  return statusString;
}

export interface TorrentsListInfo {
  info: string;
  keyboard: InlineKeyboardMarkup;
}

// TODO: add refresh button
export async function getTelegramTorrentsListInfo(page: number = 0): Promise<TorrentsListInfo> {
  const torrents = await prisma.torrent.findMany();

  const start = page * LIST_PAGE_SIZE;
  const end = start + LIST_PAGE_SIZE;

  const pageTorrents = torrents.slice(start, end);

  const hasPrevButton = start > 0;
  const hastNextButton = end < torrents.length;

  return {
    info: formatTorrents(pageTorrents) || 'Нет торрентов',
    keyboard: prepareInlineKeyboard(
      [
        ...pageTorrents.map((torrent) => [
          {
            type: 'callback',
            text: torrent.name ?? 'Неизвестно',
            callbackData: {
              source: CallbackButtonSource.TORRENTS_LIST_ITEM,
              torrentId: torrent.infoHash,
            },
          } as const,
        ]),
        hasPrevButton || hastNextButton
          ? [
              hasPrevButton
                ? ({
                    type: 'callback',
                    text: '⬅',
                    callbackData: {
                      source: CallbackButtonSource.TORRENTS_LIST_PAGE,
                      page: page - 1,
                    },
                  } as const)
                : null,
              hastNextButton
                ? ({
                    type: 'callback',
                    text: '➡',
                    callbackData: {
                      source: CallbackButtonSource.TORRENTS_LIST_PAGE,
                      page: page + 1,
                    },
                  } as const)
                : null,
            ].filter(isDefined)
          : null,
      ].filter(isDefined),
    ),
  };
}

export interface TorrentInfo {
  info: string;
  keyboard: InlineKeyboardMarkup;
}

export async function getTelegramTorrentInfo(infoHash: string): Promise<TorrentInfo> {
  const [clientState, torrent] = await Promise.all([
    torrentClient.getState(),
    prisma.torrent.findUnique({
      where: {
        infoHash,
      },
    }),
  ]);

  if (!torrent) {
    throw new CustomError('Торрент не найден');
  }

  // TODO: for downloading: show actual progress, show time remaining
  // TODO: show all files info
  const info = `
Название: ${torrent.name}
Статус: ${STATE_TITLE[torrent.state]}
Размер: ${formatSize(torrent.size)}
Скачано: ${formatPercent(torrent.progress)}
`;

  const isPausedOrError = torrent.state === 'Paused' || torrent.state === 'Error';
  const isCritical = clientState.criticalTorrentId === infoHash;

  return {
    info: info.trim(),
    keyboard: prepareInlineKeyboard(
      [
        torrent.state === 'Finished'
          ? null
          : [
              {
                type: 'callback',
                text: 'Обновить',
                callbackData: {
                  source: CallbackButtonSource.TORRENT_REFRESH,
                  torrentId: infoHash,
                },
              } as const,
              {
                type: 'callback',
                text: isCritical ? 'Сделать некритичным' : 'Сделать критичным',
                callbackData: {
                  source: CallbackButtonSource.TORRENT_SET_CRITICAL,
                  torrentId: infoHash,
                  critical: !isCritical,
                },
              } as const,
            ],
        [
          {
            type: 'callback',
            text: 'Удалить',
            callbackData: {
              source: CallbackButtonSource.TORRENT_DELETE,
              torrentId: infoHash,
            },
          } as const,
          torrent.state === 'Finished'
            ? null
            : ({
                type: 'callback',
                text: isPausedOrError ? 'Продолжить' : 'Пауза',
                callbackData: {
                  source: CallbackButtonSource.TORRENT_PAUSE,
                  torrentId: infoHash,
                  pause: !isPausedOrError,
                },
              } as const),
        ].filter(isDefined),
        [
          {
            type: 'callback',
            text: '⬅ К списку',
            callbackData: {
              source: CallbackButtonSource.TORRENT_BACK_TO_LIST,
            },
          } as const,
        ],
      ].filter(isDefined),
    ),
  };
}

export function formatTorrents(torrents: Torrent[]): string {
  const sortedTorrents = sortBy(torrents, ({ state }) => STATUS_STATE_SORTING[state]);
  const groupedTorrents = groupBy(sortedTorrents, ({ state }) => state);

  return map(groupedTorrents, (torrents, groupString) => {
    return `${STATE_TITLE[groupString as TorrentState]}
${torrents.map(formatTorrentsListItem).join('\n')}`;
  }).join('\n\n');
}

export function formatTorrentsListItem(torrent: Torrent): string {
  // TODO: for downloading: show actual progress, show time remaining

  return `${torrent.name ?? 'Неизвестно'} (${formatSize(torrent.size)}, ${formatPercent(torrent.progress)})`;
}
