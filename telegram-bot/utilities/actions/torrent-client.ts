import { Torrent, TorrentFile, TorrentFileState, TorrentState } from '@prisma/client';
import { Markdown, MessageActionMode } from '@tg-sensei/bot';
import sortBy from 'lodash/sortBy';
import torrentClient from 'torrent-client/client';
import { Torrent as ClientTorrent } from 'webtorrent';

import { ActionsStreamAction, MessageAction } from 'telegram-bot/types/actions';

import TorrentClient from 'torrent-client/utilities/TorrentClient';
import { formatDuration } from 'utilities/date';
import { getFileIcon } from 'utilities/file';
import { formatPercent, formatProgress, minmax } from 'utilities/number';
import { formatSize, formatSpeed } from 'utilities/size';

import { getTorrentAction } from 'telegram-bot/actions/torrent-client/torrents/torrent/item';

const STATUS_STATE_SORTING: Record<TorrentState, number> = {
  [TorrentState.Downloading]: 0,
  [TorrentState.Verifying]: 1,
  [TorrentState.Queued]: 2,
  [TorrentState.Paused]: 3,
  [TorrentState.Error]: 4,
  [TorrentState.Finished]: 5,
};

const STATE_TITLE: Record<TorrentState, string> = {
  [TorrentState.Downloading]: '🟢 Скачивается',
  [TorrentState.Verifying]: '🟡 Проверяется',
  [TorrentState.Queued]: '🔵 В очереди',
  [TorrentState.Paused]: '🟠 На паузе',
  [TorrentState.Error]: '🔴 Ошибка',
  [TorrentState.Finished]: '⚪️ Завершен',
};

export async function getAddTorrentAction(
  mode: MessageActionMode,
  getTorrent: () => Promise<Torrent | null>,
): Promise<ActionsStreamAction> {
  return new ActionsStreamAction(async function* () {
    yield new MessageAction({
      content: {
        type: 'text',
        text: 'Торрент добавляется...',
      },
    });

    const torrent = await getTorrent();

    if (!torrent) {
      yield new MessageAction({
        mode,
        content: {
          type: 'text',
          text: 'Данные торрента отсутствуют',
        },
      });

      return;
    }

    yield new MessageAction({
      mode,
      content: {
        type: 'text',
        text: Markdown.create`Торрент${torrent.name ? Markdown.create` "${torrent.name}"` : ''} добавлен!`,
      },
    });

    yield getTorrentAction(torrent.infoHash, {
      mode,
    });
  });
}

export function sortTorrents(torrents: Torrent[]): Torrent[] {
  return sortBy(torrents, ({ state }) => STATUS_STATE_SORTING[state]);
}

export async function formatTorrents(torrents: Torrent[]): Promise<Markdown> {
  const sortedTorrents = sortTorrents(torrents);
  const formattedTorrents = await Promise.all(sortedTorrents.map((torrent) => formatTorrent(torrent)));

  return Markdown.join(formattedTorrents, '\n\n\n');
}

export type FormatTorrentOptions = {
  indexString?: string;
};

export async function formatTorrent(torrent: Torrent, options: FormatTorrentOptions = {}): Promise<Markdown> {
  const { indexString } = options;

  const [clientTorrent, clientState] = await Promise.all([
    torrentClient.getClientTorrent(torrent.infoHash),
    torrentClient.getState(),
  ]);
  const progress = TorrentClient.getRealProgress(torrent, torrent, clientTorrent);

  const text = Markdown.create`🅰️ ${Markdown.bold('Название')}: ${indexString && Markdown.create`${indexString} `}${
    clientState.criticalTorrentId === torrent.infoHash ? '❗️ ' : ''
  }${torrent.name ?? 'Неизвестно'}
⚫️ ${Markdown.bold('Статус')}: ${STATE_TITLE[torrent.state]}
💾 ${Markdown.bold('Размер')}: ${formatSize(torrent.size)}`;

  if (torrent.state !== TorrentState.Finished) {
    text.add`
💯 ${Markdown.bold('Прогресс')}: ${formatProgress(progress)} ${formatPercent(progress)}`;
  }

  if (torrent.state === TorrentState.Downloading && clientTorrent) {
    text.add`
⏳ ${Markdown.bold('Осталось')}: ${formatDuration(clientTorrent.timeRemaining)}
⚡️ ${Markdown.bold('Скорость загрузки')}: ${formatSpeed(clientTorrent.downloadSpeed)}`;
  }

  if (torrent.state === TorrentState.Verifying && clientTorrent) {
    const verifiedProgress = minmax(TorrentClient.getProgress(clientTorrent) / torrent.progress || 0, 0, 1);

    text.add`
⚠️ ${Markdown.bold('Проверено')}: ${formatProgress(verifiedProgress)} ${formatPercent(verifiedProgress)}`;
  }

  if (torrent.state === 'Error' && torrent.errorMessage) {
    text.add`
${Markdown.bold('Ошибка')}: ${torrent.errorMessage}`;
  }

  return text;
}

export type FormatTorrentFileOptions = {
  torrent: Torrent;
  clientTorrent: ClientTorrent | null;
  indexString?: string;
};

export function formatTorrentFile(file: TorrentFile, options: FormatTorrentFileOptions): Markdown {
  const { torrent, clientTorrent, indexString } = options;

  const clientTorrentFile = clientTorrent?.files.find(({ path }) => path === file.path);

  const text = Markdown.create`🅰️ ${Markdown.bold('Файл')}: ${
    indexString && Markdown.create`${indexString} `
  }${getFileIcon(file.path)} ${TorrentClient.getFileRelativePath(file, torrent)}
💾 ${Markdown.bold('Размер')}: ${formatSize(file.size)}`;

  if (file.state !== TorrentFileState.Finished) {
    const progress = TorrentClient.getRealProgress(file, torrent, clientTorrentFile);

    text.add`
💯 ${Markdown.bold('Прогресс')}: ${formatProgress(progress)} ${formatPercent(progress)}`;
  }

  return text;
}
