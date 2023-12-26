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
  [CallbackButtonSource.TORRENTS_LIST_ITEM]: ({ torrentId }) => ({
    t: torrentId,
  }),
  [CallbackButtonSource.TORRENTS_LIST_PAGE]: ({ page }) => ({
    p: page,
  }),
  [CallbackButtonSource.TORRENTS_LIST_REFRESH]: ({ page }) => ({
    p: page,
  }),
  [CallbackButtonSource.TORRENT_REFRESH]: ({ torrentId }) => ({
    t: torrentId,
  }),
  [CallbackButtonSource.TORRENT_DELETE]: ({ torrentId }) => ({
    t: torrentId,
  }),
  [CallbackButtonSource.TORRENT_DELETE_CONFIRM]: ({ torrentId }) => ({
    t: torrentId,
  }),
  [CallbackButtonSource.TORRENT_PAUSE]: ({ torrentId, pause }) => ({
    t: torrentId,
    p: booleanToNumber(pause),
  }),
  [CallbackButtonSource.TORRENT_SET_CRITICAL]: ({ torrentId, critical }) => ({
    t: torrentId,
    c: booleanToNumber(critical),
  }),
  [CallbackButtonSource.STATUS_PAUSE]: ({ pause }) => ({
    p: booleanToNumber(pause),
  }),
  [CallbackButtonSource.NAVIGATE_TO_TORRENT]: ({ torrentId }) => ({
    t: torrentId,
  }),
  [CallbackButtonSource.RUTRACKER_SEARCH_ADD_TORRENT]: ({ torrentId }) => ({
    t: torrentId,
  }),
};

export const beautifyCallbackDataMapper: {
  [Source in BeautifiedCallbackDataSourceWithData]: (
    uglifiedData: UglifiedCallbackDataBySource<Source>,
  ) => Omit<BeautifiedCallbackDataBySource<Source>, 'source'>;
} = {
  [CallbackButtonSource.TORRENTS_LIST_ITEM]: ({ t }) => ({
    torrentId: t,
  }),
  [CallbackButtonSource.TORRENTS_LIST_PAGE]: ({ p }) => ({
    page: p,
  }),
  [CallbackButtonSource.TORRENTS_LIST_REFRESH]: ({ p }) => ({
    page: p,
  }),
  [CallbackButtonSource.TORRENT_REFRESH]: ({ t }) => ({
    torrentId: t,
  }),
  [CallbackButtonSource.TORRENT_DELETE]: ({ t }) => ({
    torrentId: t,
  }),
  [CallbackButtonSource.TORRENT_DELETE_CONFIRM]: ({ t }) => ({
    torrentId: t,
  }),
  [CallbackButtonSource.TORRENT_PAUSE]: ({ t, p }) => ({
    torrentId: t,
    pause: numberToBoolean(p),
  }),
  [CallbackButtonSource.TORRENT_SET_CRITICAL]: ({ t, c }) => ({
    torrentId: t,
    critical: numberToBoolean(c),
  }),
  [CallbackButtonSource.STATUS_PAUSE]: ({ p }) => ({
    pause: numberToBoolean(p),
  }),
  [CallbackButtonSource.NAVIGATE_TO_TORRENT]: ({ t }) => ({
    torrentId: t,
  }),
  [CallbackButtonSource.RUTRACKER_SEARCH_ADD_TORRENT]: ({ t }) => ({
    torrentId: t,
  }),
};
