import {
  BeautifiedCallbackDataBySource,
  BeautifiedCallbackDataSourceWithData,
  CallbackButtonSource,
  UglifiedCallbackDataBySource,
  UglifiedCallbackDataSourceWithData,
} from 'telegram-bot/types/keyboard';

import { booleanToNumber, numberToBoolean } from 'utilities/convert';

export const uglifyCallbackDataMapper: {
  [Source in UglifiedCallbackDataSourceWithData]: (
    beautifiedData: BeautifiedCallbackDataBySource<Source>,
  ) => Omit<UglifiedCallbackDataBySource<Source>, '$'>;
} = {
  [CallbackButtonSource.TORRENT_CLIENT_TORRENTS_LIST_ITEM]: ({ torrentId }) => ({
    t: torrentId,
  }),
  [CallbackButtonSource.TORRENT_CLIENT_TORRENTS_LIST_PAGE]: ({ page }) => ({
    p: page,
  }),
  [CallbackButtonSource.TORRENT_CLIENT_TORRENTS_LIST_REFRESH]: ({ page }) => ({
    p: page,
  }),
  [CallbackButtonSource.TORRENT_CLIENT_TORRENT_REFRESH]: ({ torrentId }) => ({
    t: torrentId,
  }),
  [CallbackButtonSource.TORRENT_CLIENT_TORRENT_DELETE]: ({ torrentId }) => ({
    t: torrentId,
  }),
  [CallbackButtonSource.TORRENT_CLIENT_TORRENT_DELETE_CONFIRM]: ({ torrentId }) => ({
    t: torrentId,
  }),
  [CallbackButtonSource.TORRENT_CLIENT_TORRENT_PAUSE]: ({ torrentId, pause }) => ({
    t: torrentId,
    p: booleanToNumber(pause),
  }),
  [CallbackButtonSource.TORRENT_CLIENT_TORRENT_SET_CRITICAL]: ({ torrentId, critical }) => ({
    t: torrentId,
    c: booleanToNumber(critical),
  }),
  [CallbackButtonSource.TORRENT_CLIENT_STATUS_PAUSE]: ({ pause }) => ({
    p: booleanToNumber(pause),
  }),
  [CallbackButtonSource.TORRENT_CLIENT_NAVIGATE_TO_TORRENT]: ({ torrentId }) => ({
    t: torrentId,
  }),
  [CallbackButtonSource.TORRENT_CLIENT_RUTRACKER_SEARCH_ADD_TORRENT]: ({ torrentId }) => ({
    t: torrentId,
  }),
};

export const beautifyCallbackDataMapper: {
  [Source in BeautifiedCallbackDataSourceWithData]: (
    uglifiedData: UglifiedCallbackDataBySource<Source>,
  ) => Omit<BeautifiedCallbackDataBySource<Source>, 'source'>;
} = {
  [CallbackButtonSource.TORRENT_CLIENT_TORRENTS_LIST_ITEM]: ({ t }) => ({
    torrentId: t,
  }),
  [CallbackButtonSource.TORRENT_CLIENT_TORRENTS_LIST_PAGE]: ({ p }) => ({
    page: p,
  }),
  [CallbackButtonSource.TORRENT_CLIENT_TORRENTS_LIST_REFRESH]: ({ p }) => ({
    page: p,
  }),
  [CallbackButtonSource.TORRENT_CLIENT_TORRENT_REFRESH]: ({ t }) => ({
    torrentId: t,
  }),
  [CallbackButtonSource.TORRENT_CLIENT_TORRENT_DELETE]: ({ t }) => ({
    torrentId: t,
  }),
  [CallbackButtonSource.TORRENT_CLIENT_TORRENT_DELETE_CONFIRM]: ({ t }) => ({
    torrentId: t,
  }),
  [CallbackButtonSource.TORRENT_CLIENT_TORRENT_PAUSE]: ({ t, p }) => ({
    torrentId: t,
    pause: numberToBoolean(p),
  }),
  [CallbackButtonSource.TORRENT_CLIENT_TORRENT_SET_CRITICAL]: ({ t, c }) => ({
    torrentId: t,
    critical: numberToBoolean(c),
  }),
  [CallbackButtonSource.TORRENT_CLIENT_STATUS_PAUSE]: ({ p }) => ({
    pause: numberToBoolean(p),
  }),
  [CallbackButtonSource.TORRENT_CLIENT_NAVIGATE_TO_TORRENT]: ({ t }) => ({
    torrentId: t,
  }),
  [CallbackButtonSource.TORRENT_CLIENT_RUTRACKER_SEARCH_ADD_TORRENT]: ({ t }) => ({
    torrentId: t,
  }),
};
