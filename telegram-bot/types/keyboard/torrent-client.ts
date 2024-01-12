import { z } from 'zod';

import { binarySchema } from 'telegram-bot/types/zod';

export enum TorrentClientCallbackButtonSource {
  // Status
  BACK_TO_STATUS = 't0',
  STATUS_REFRESH = 't1',
  STATUS_PAUSE = 't2',
  STATUS_SHOW_TORRENTS_LIST = 't3',

  // Torrent list
  TORRENTS_LIST_ITEM = 't4',
  TORRENTS_LIST_PAGE = 't5',
  TORRENTS_LIST_REFRESH = 't6',

  // Torrent
  TORRENT_REFRESH = 't7',
  TORRENT_DELETE = 't8',
  TORRENT_DELETE_CONFIRM = 't9',
  TORRENT_PAUSE = 't10',
  TORRENT_SET_CRITICAL = 't11',
  TORRENT_BACK_TO_LIST = 't12',
  TORRENT_SHOW_FILES = 't13',

  // File list
  FILES_LIST_PAGE = 't14',
  FILES_LIST_REFRESH = 't15',
  FILES_LIST_BACK_TO_TORRENT = 't16',
  NAVIGATE_TO_FILE = 't17',

  // File
  FILE_REFRESH = 't18',
  DELETE_FILE = 't19',
  DELETE_FILE_CONFIRM = 't20',
  BACK_TO_FILES_LIST = 't21',

  // Misc
  ADD_TORRENT = 't22',
  NAVIGATE_TO_TORRENT = 't23',

  // Rutracker
  RUTRACKER_SEARCH = 't25',
  RUTRACKER_SEARCH_ADD_TORRENT = 't24',
}

export const torrentClientCallbackDataSchema = z.union([
  z.object({
    $: z.literal(TorrentClientCallbackButtonSource.BACK_TO_STATUS),
  }),

  z.object({
    $: z.literal(TorrentClientCallbackButtonSource.STATUS_REFRESH),
  }),

  z.object({
    $: z.literal(TorrentClientCallbackButtonSource.STATUS_PAUSE),
    p: binarySchema,
  }),

  z.object({
    $: z.literal(TorrentClientCallbackButtonSource.STATUS_SHOW_TORRENTS_LIST),
  }),

  z.object({
    $: z.literal(TorrentClientCallbackButtonSource.TORRENTS_LIST_ITEM),
    t: z.string(),
  }),

  z.object({
    $: z.literal(TorrentClientCallbackButtonSource.TORRENTS_LIST_PAGE),
    p: z.number(),
  }),

  z.object({
    $: z.literal(TorrentClientCallbackButtonSource.TORRENTS_LIST_REFRESH),
    p: z.number(),
  }),

  z.object({
    $: z.literal(TorrentClientCallbackButtonSource.TORRENT_REFRESH),
    t: z.string(),
  }),

  z.object({
    $: z.literal(TorrentClientCallbackButtonSource.TORRENT_DELETE),
    t: z.string(),
  }),

  z.object({
    $: z.literal(TorrentClientCallbackButtonSource.TORRENT_DELETE_CONFIRM),
    t: z.string(),
  }),

  z.object({
    $: z.literal(TorrentClientCallbackButtonSource.TORRENT_PAUSE),
    t: z.string(),
    p: binarySchema,
  }),

  z.object({
    $: z.literal(TorrentClientCallbackButtonSource.TORRENT_SET_CRITICAL),
    t: z.string(),
    c: binarySchema,
  }),

  z.object({
    $: z.literal(TorrentClientCallbackButtonSource.TORRENT_BACK_TO_LIST),
  }),

  z.object({
    $: z.literal(TorrentClientCallbackButtonSource.TORRENT_SHOW_FILES),
    t: z.string(),
  }),

  z.object({
    $: z.literal(TorrentClientCallbackButtonSource.FILES_LIST_PAGE),
    t: z.string(),
    p: z.number(),
  }),

  z.object({
    $: z.literal(TorrentClientCallbackButtonSource.FILES_LIST_REFRESH),
    t: z.string(),
    p: z.number(),
  }),

  z.object({
    $: z.literal(TorrentClientCallbackButtonSource.FILES_LIST_BACK_TO_TORRENT),
    t: z.string(),
  }),

  z.object({
    $: z.literal(TorrentClientCallbackButtonSource.NAVIGATE_TO_FILE),
    f: z.number(),
  }),

  z.object({
    $: z.literal(TorrentClientCallbackButtonSource.FILE_REFRESH),
    f: z.number(),
  }),

  z.object({
    $: z.literal(TorrentClientCallbackButtonSource.DELETE_FILE),
    f: z.number(),
  }),

  z.object({
    $: z.literal(TorrentClientCallbackButtonSource.DELETE_FILE_CONFIRM),
    f: z.number(),
  }),

  z.object({
    $: z.literal(TorrentClientCallbackButtonSource.BACK_TO_FILES_LIST),
    t: z.string(),
  }),

  z.object({
    $: z.literal(TorrentClientCallbackButtonSource.ADD_TORRENT),
  }),

  z.object({
    $: z.literal(TorrentClientCallbackButtonSource.NAVIGATE_TO_TORRENT),
    t: z.string(),
  }),

  z.object({
    $: z.literal(TorrentClientCallbackButtonSource.RUTRACKER_SEARCH),
  }),

  z.object({
    $: z.literal(TorrentClientCallbackButtonSource.RUTRACKER_SEARCH_ADD_TORRENT),
    t: z.string(),
  }),
]);

export type TorrentClientBeautifiedCallbackData =
  | {
      source: TorrentClientCallbackButtonSource.BACK_TO_STATUS;
    }
  | {
      source: TorrentClientCallbackButtonSource.STATUS_REFRESH;
    }
  | {
      source: TorrentClientCallbackButtonSource.STATUS_PAUSE;
      pause: boolean;
    }
  | {
      source: TorrentClientCallbackButtonSource.STATUS_SHOW_TORRENTS_LIST;
    }
  | {
      source: TorrentClientCallbackButtonSource.TORRENTS_LIST_ITEM;
      torrentId: string;
    }
  | {
      source: TorrentClientCallbackButtonSource.TORRENTS_LIST_PAGE;
      page: number;
    }
  | {
      source: TorrentClientCallbackButtonSource.TORRENTS_LIST_REFRESH;
      page: number;
    }
  | {
      source: TorrentClientCallbackButtonSource.TORRENT_REFRESH;
      torrentId: string;
    }
  | {
      source: TorrentClientCallbackButtonSource.TORRENT_DELETE;
      torrentId: string;
    }
  | {
      source: TorrentClientCallbackButtonSource.TORRENT_DELETE_CONFIRM;
      torrentId: string;
    }
  | {
      source: TorrentClientCallbackButtonSource.TORRENT_PAUSE;
      torrentId: string;
      pause: boolean;
    }
  | {
      source: TorrentClientCallbackButtonSource.TORRENT_SET_CRITICAL;
      torrentId: string;
      critical: boolean;
    }
  | {
      source: TorrentClientCallbackButtonSource.TORRENT_BACK_TO_LIST;
    }
  | {
      source: TorrentClientCallbackButtonSource.TORRENT_SHOW_FILES;
      torrentId: string;
    }
  | {
      source: TorrentClientCallbackButtonSource.FILES_LIST_PAGE;
      torrentId: string;
      page: number;
    }
  | {
      source: TorrentClientCallbackButtonSource.FILES_LIST_REFRESH;
      torrentId: string;
      page: number;
    }
  | {
      source: TorrentClientCallbackButtonSource.FILES_LIST_BACK_TO_TORRENT;
      torrentId: string;
    }
  | {
      source: TorrentClientCallbackButtonSource.NAVIGATE_TO_FILE;
      fileId: number;
    }
  | {
      source: TorrentClientCallbackButtonSource.FILE_REFRESH;
      fileId: number;
    }
  | {
      source: TorrentClientCallbackButtonSource.DELETE_FILE;
      fileId: number;
    }
  | {
      source: TorrentClientCallbackButtonSource.DELETE_FILE_CONFIRM;
      fileId: number;
    }
  | {
      source: TorrentClientCallbackButtonSource.BACK_TO_FILES_LIST;
      torrentId: string;
    }
  | {
      source: TorrentClientCallbackButtonSource.ADD_TORRENT;
    }
  | {
      source: TorrentClientCallbackButtonSource.NAVIGATE_TO_TORRENT;
      torrentId: string;
    }
  | {
      source: TorrentClientCallbackButtonSource.RUTRACKER_SEARCH;
    }
  | {
      source: TorrentClientCallbackButtonSource.RUTRACKER_SEARCH_ADD_TORRENT;
      torrentId: string;
    };
