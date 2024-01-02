import { BeautifyCallbackDataMapper, UglifyCallbackDataMapper } from 'telegram-bot/types/keyboard';
import { TorrentClientCallbackButtonSource } from 'telegram-bot/types/keyboard/torrent-client';

import { booleanToNumber, numberToBoolean } from 'utilities/convert';

export const torrentClientUglifyCallbackDataMapper: UglifyCallbackDataMapper<TorrentClientCallbackButtonSource> = {
  [TorrentClientCallbackButtonSource.TORRENTS_LIST_ITEM]: ({ torrentId }) => ({
    t: torrentId,
  }),
  [TorrentClientCallbackButtonSource.TORRENTS_LIST_PAGE]: ({ page }) => ({
    p: page,
  }),
  [TorrentClientCallbackButtonSource.TORRENTS_LIST_REFRESH]: ({ page }) => ({
    p: page,
  }),
  [TorrentClientCallbackButtonSource.TORRENT_REFRESH]: ({ torrentId }) => ({
    t: torrentId,
  }),
  [TorrentClientCallbackButtonSource.TORRENT_DELETE]: ({ torrentId }) => ({
    t: torrentId,
  }),
  [TorrentClientCallbackButtonSource.TORRENT_DELETE_CONFIRM]: ({ torrentId }) => ({
    t: torrentId,
  }),
  [TorrentClientCallbackButtonSource.TORRENT_PAUSE]: ({ torrentId, pause }) => ({
    t: torrentId,
    p: booleanToNumber(pause),
  }),
  [TorrentClientCallbackButtonSource.TORRENT_SET_CRITICAL]: ({ torrentId, critical }) => ({
    t: torrentId,
    c: booleanToNumber(critical),
  }),
  [TorrentClientCallbackButtonSource.STATUS_PAUSE]: ({ pause }) => ({
    p: booleanToNumber(pause),
  }),
  [TorrentClientCallbackButtonSource.TORRENT_SHOW_FILES]: ({ torrentId }) => ({
    t: torrentId,
  }),
  [TorrentClientCallbackButtonSource.FILES_LIST_PAGE]: ({ torrentId, page }) => ({
    t: torrentId,
    p: page,
  }),
  [TorrentClientCallbackButtonSource.FILES_LIST_REFRESH]: ({ torrentId, page }) => ({
    t: torrentId,
    p: page,
  }),
  [TorrentClientCallbackButtonSource.FILES_LIST_BACK_TO_TORRENT]: ({ torrentId }) => ({
    t: torrentId,
  }),
  [TorrentClientCallbackButtonSource.NAVIGATE_TO_FILE]: ({ fileId }) => ({
    f: fileId,
  }),
  [TorrentClientCallbackButtonSource.FILE_REFRESH]: ({ fileId }) => ({
    f: fileId,
  }),
  [TorrentClientCallbackButtonSource.DELETE_FILE]: ({ fileId }) => ({
    f: fileId,
  }),
  [TorrentClientCallbackButtonSource.DELETE_FILE_CONFIRM]: ({ fileId }) => ({
    f: fileId,
  }),
  [TorrentClientCallbackButtonSource.BACK_TO_FILES_LIST]: ({ torrentId }) => ({
    t: torrentId,
  }),
  [TorrentClientCallbackButtonSource.NAVIGATE_TO_TORRENT]: ({ torrentId }) => ({
    t: torrentId,
  }),
  [TorrentClientCallbackButtonSource.RUTRACKER_SEARCH_ADD_TORRENT]: ({ torrentId }) => ({
    t: torrentId,
  }),
};

export const torrentClientBeautifyCallbackDataMapper: BeautifyCallbackDataMapper<TorrentClientCallbackButtonSource> = {
  [TorrentClientCallbackButtonSource.TORRENTS_LIST_ITEM]: ({ t }) => ({
    torrentId: t,
  }),
  [TorrentClientCallbackButtonSource.TORRENTS_LIST_PAGE]: ({ p }) => ({
    page: p,
  }),
  [TorrentClientCallbackButtonSource.TORRENTS_LIST_REFRESH]: ({ p }) => ({
    page: p,
  }),
  [TorrentClientCallbackButtonSource.TORRENT_REFRESH]: ({ t }) => ({
    torrentId: t,
  }),
  [TorrentClientCallbackButtonSource.TORRENT_DELETE]: ({ t }) => ({
    torrentId: t,
  }),
  [TorrentClientCallbackButtonSource.TORRENT_DELETE_CONFIRM]: ({ t }) => ({
    torrentId: t,
  }),
  [TorrentClientCallbackButtonSource.TORRENT_PAUSE]: ({ t, p }) => ({
    torrentId: t,
    pause: numberToBoolean(p),
  }),
  [TorrentClientCallbackButtonSource.TORRENT_SET_CRITICAL]: ({ t, c }) => ({
    torrentId: t,
    critical: numberToBoolean(c),
  }),
  [TorrentClientCallbackButtonSource.STATUS_PAUSE]: ({ p }) => ({
    pause: numberToBoolean(p),
  }),
  [TorrentClientCallbackButtonSource.TORRENT_SHOW_FILES]: ({ t }) => ({
    torrentId: t,
  }),
  [TorrentClientCallbackButtonSource.FILES_LIST_PAGE]: ({ t, p }) => ({
    torrentId: t,
    page: p,
  }),
  [TorrentClientCallbackButtonSource.FILES_LIST_REFRESH]: ({ t, p }) => ({
    torrentId: t,
    page: p,
  }),
  [TorrentClientCallbackButtonSource.FILES_LIST_BACK_TO_TORRENT]: ({ t }) => ({
    torrentId: t,
  }),
  [TorrentClientCallbackButtonSource.NAVIGATE_TO_FILE]: ({ f }) => ({
    fileId: f,
  }),
  [TorrentClientCallbackButtonSource.FILE_REFRESH]: ({ f }) => ({
    fileId: f,
  }),
  [TorrentClientCallbackButtonSource.DELETE_FILE]: ({ f }) => ({
    fileId: f,
  }),
  [TorrentClientCallbackButtonSource.DELETE_FILE_CONFIRM]: ({ f }) => ({
    fileId: f,
  }),
  [TorrentClientCallbackButtonSource.BACK_TO_FILES_LIST]: ({ t }) => ({
    torrentId: t,
  }),
  [TorrentClientCallbackButtonSource.NAVIGATE_TO_TORRENT]: ({ t }) => ({
    torrentId: t,
  }),
  [TorrentClientCallbackButtonSource.RUTRACKER_SEARCH_ADD_TORRENT]: ({ t }) => ({
    torrentId: t,
  }),
};
