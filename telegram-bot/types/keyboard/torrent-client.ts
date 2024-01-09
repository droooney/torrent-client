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

export const statusBackToStatusCallbackDataSchema = z.object({
  $: z.literal(TorrentClientCallbackButtonSource.BACK_TO_STATUS),
});

export const statusRefreshCallbackDataSchema = z.object({
  $: z.literal(TorrentClientCallbackButtonSource.STATUS_REFRESH),
});

export const statusPauseCallbackDataSchema = z.object({
  $: z.literal(TorrentClientCallbackButtonSource.STATUS_PAUSE),
  p: binarySchema,
});

export const statusShowTorrentsListCallbackDataSchema = z.object({
  $: z.literal(TorrentClientCallbackButtonSource.STATUS_SHOW_TORRENTS_LIST),
});

export const torrentsListItemCallbackDataSchema = z.object({
  $: z.literal(TorrentClientCallbackButtonSource.TORRENTS_LIST_ITEM),
  t: z.string(),
});

export const torrentsListPageCallbackDataSchema = z.object({
  $: z.literal(TorrentClientCallbackButtonSource.TORRENTS_LIST_PAGE),
  p: z.number(),
});

export const torrentsListRefreshCallbackDataSchema = z.object({
  $: z.literal(TorrentClientCallbackButtonSource.TORRENTS_LIST_REFRESH),
  p: z.number(),
});

export const torrentRefreshCallbackDataSchema = z.object({
  $: z.literal(TorrentClientCallbackButtonSource.TORRENT_REFRESH),
  t: z.string(),
});

export const torrentDeleteCallbackDataSchema = z.object({
  $: z.literal(TorrentClientCallbackButtonSource.TORRENT_DELETE),
  t: z.string(),
});

export const torrentDeleteConfirmCallbackDataSchema = z.object({
  $: z.literal(TorrentClientCallbackButtonSource.TORRENT_DELETE_CONFIRM),
  t: z.string(),
});

export const torrentPauseCallbackDataSchema = z.object({
  $: z.literal(TorrentClientCallbackButtonSource.TORRENT_PAUSE),
  t: z.string(),
  p: binarySchema,
});

export const torrentSetCriticalCallbackDataSchema = z.object({
  $: z.literal(TorrentClientCallbackButtonSource.TORRENT_SET_CRITICAL),
  t: z.string(),
  c: binarySchema,
});

export const torrentBackToListCallbackDataSchema = z.object({
  $: z.literal(TorrentClientCallbackButtonSource.TORRENT_BACK_TO_LIST),
});

export const torrentShowFilesCallbackDataSchema = z.object({
  $: z.literal(TorrentClientCallbackButtonSource.TORRENT_SHOW_FILES),
  t: z.string(),
});

export const filesListPageCallbackDataSchema = z.object({
  $: z.literal(TorrentClientCallbackButtonSource.FILES_LIST_PAGE),
  t: z.string(),
  p: z.number(),
});

export const filesListRefreshCallbackDataSchema = z.object({
  $: z.literal(TorrentClientCallbackButtonSource.FILES_LIST_REFRESH),
  t: z.string(),
  p: z.number(),
});

export const filesListBackToTorrentCallbackDataSchema = z.object({
  $: z.literal(TorrentClientCallbackButtonSource.FILES_LIST_BACK_TO_TORRENT),
  t: z.string(),
});

export const navigateToFileCallbackDataSchema = z.object({
  $: z.literal(TorrentClientCallbackButtonSource.NAVIGATE_TO_FILE),
  f: z.number(),
});

export const fileRefreshCallbackDataSchema = z.object({
  $: z.literal(TorrentClientCallbackButtonSource.FILE_REFRESH),
  f: z.number(),
});

export const deleteFileCallbackDataSchema = z.object({
  $: z.literal(TorrentClientCallbackButtonSource.DELETE_FILE),
  f: z.number(),
});

export const deleteFileConfirmCallbackDataSchema = z.object({
  $: z.literal(TorrentClientCallbackButtonSource.DELETE_FILE_CONFIRM),
  f: z.number(),
});

export const backToFilesListCallbackDataSchema = z.object({
  $: z.literal(TorrentClientCallbackButtonSource.BACK_TO_FILES_LIST),
  t: z.string(),
});

export const addTorrentCallbackDataSchema = z.object({
  $: z.literal(TorrentClientCallbackButtonSource.ADD_TORRENT),
});

export const navigateToTorrentCallbackDataSchema = z.object({
  $: z.literal(TorrentClientCallbackButtonSource.NAVIGATE_TO_TORRENT),
  t: z.string(),
});

export const rutrackerSearchCallbackDataSchema = z.object({
  $: z.literal(TorrentClientCallbackButtonSource.RUTRACKER_SEARCH),
});

export const rutrackerSearchAddTorrentCallbackDataSchema = z.object({
  $: z.literal(TorrentClientCallbackButtonSource.RUTRACKER_SEARCH_ADD_TORRENT),
  t: z.string(),
});

export const torrentClientCallbackDataSchema = z.union([
  statusBackToStatusCallbackDataSchema,
  statusRefreshCallbackDataSchema,
  statusPauseCallbackDataSchema,
  statusShowTorrentsListCallbackDataSchema,
  torrentsListItemCallbackDataSchema,
  torrentsListPageCallbackDataSchema,
  torrentsListRefreshCallbackDataSchema,
  torrentRefreshCallbackDataSchema,
  torrentDeleteCallbackDataSchema,
  torrentDeleteConfirmCallbackDataSchema,
  torrentPauseCallbackDataSchema,
  torrentSetCriticalCallbackDataSchema,
  torrentBackToListCallbackDataSchema,
  torrentShowFilesCallbackDataSchema,
  filesListPageCallbackDataSchema,
  filesListRefreshCallbackDataSchema,
  filesListBackToTorrentCallbackDataSchema,
  navigateToFileCallbackDataSchema,
  fileRefreshCallbackDataSchema,
  deleteFileCallbackDataSchema,
  deleteFileConfirmCallbackDataSchema,
  backToFilesListCallbackDataSchema,
  addTorrentCallbackDataSchema,
  navigateToTorrentCallbackDataSchema,
  rutrackerSearchCallbackDataSchema,
  rutrackerSearchAddTorrentCallbackDataSchema,
]);

export interface StatusBackToStatusCallbackData {
  source: z.infer<typeof statusBackToStatusCallbackDataSchema>['$'];
}

export interface StatusRefreshCallbackData {
  source: z.infer<typeof statusRefreshCallbackDataSchema>['$'];
}

export interface StatusPauseCallbackData {
  source: z.infer<typeof statusPauseCallbackDataSchema>['$'];
  pause: boolean;
}

export interface StatusShowTorrentsListCallbackData {
  source: z.infer<typeof statusShowTorrentsListCallbackDataSchema>['$'];
}

export interface TorrentsListItemCallbackData {
  source: z.infer<typeof torrentsListItemCallbackDataSchema>['$'];
  torrentId: z.infer<typeof torrentsListItemCallbackDataSchema>['t'];
}

export interface TorrentsListPageCallbackData {
  source: z.infer<typeof torrentsListPageCallbackDataSchema>['$'];
  page: z.infer<typeof torrentsListPageCallbackDataSchema>['p'];
}

export interface TorrentsListRefreshCallbackData {
  source: z.infer<typeof torrentsListRefreshCallbackDataSchema>['$'];
  page: z.infer<typeof torrentsListRefreshCallbackDataSchema>['p'];
}

export interface TorrentRefreshCallbackData {
  source: z.infer<typeof torrentRefreshCallbackDataSchema>['$'];
  torrentId: z.infer<typeof torrentRefreshCallbackDataSchema>['t'];
}

export interface TorrentDeleteCallbackData {
  source: z.infer<typeof torrentDeleteCallbackDataSchema>['$'];
  torrentId: z.infer<typeof torrentDeleteCallbackDataSchema>['t'];
}

export interface TorrentDeleteConfirmCallbackData {
  source: z.infer<typeof torrentDeleteConfirmCallbackDataSchema>['$'];
  torrentId: z.infer<typeof torrentDeleteConfirmCallbackDataSchema>['t'];
}

export interface TorrentPauseCallbackData {
  source: z.infer<typeof torrentPauseCallbackDataSchema>['$'];
  torrentId: z.infer<typeof torrentPauseCallbackDataSchema>['t'];
  pause: boolean;
}

export interface TorrentSetCriticalCallbackData {
  source: z.infer<typeof torrentSetCriticalCallbackDataSchema>['$'];
  torrentId: z.infer<typeof torrentSetCriticalCallbackDataSchema>['t'];
  critical: boolean;
}

export interface TorrentBackToListCallbackData {
  source: z.infer<typeof torrentBackToListCallbackDataSchema>['$'];
}

export interface TorrentShowFilesCallbackData {
  source: z.infer<typeof torrentShowFilesCallbackDataSchema>['$'];
  torrentId: z.infer<typeof torrentShowFilesCallbackDataSchema>['t'];
}

export interface FilesListPageCallbackData {
  source: z.infer<typeof filesListPageCallbackDataSchema>['$'];
  torrentId: z.infer<typeof filesListPageCallbackDataSchema>['t'];
  page: z.infer<typeof filesListPageCallbackDataSchema>['p'];
}

export interface FilesListRefreshCallbackData {
  source: z.infer<typeof filesListRefreshCallbackDataSchema>['$'];
  torrentId: z.infer<typeof filesListRefreshCallbackDataSchema>['t'];
  page: z.infer<typeof filesListRefreshCallbackDataSchema>['p'];
}

export interface FilesListBackToTorrentCallbackData {
  source: z.infer<typeof filesListBackToTorrentCallbackDataSchema>['$'];
  torrentId: z.infer<typeof filesListBackToTorrentCallbackDataSchema>['t'];
}

export interface NavigateToFileCallbackData {
  source: z.infer<typeof navigateToFileCallbackDataSchema>['$'];
  fileId: z.infer<typeof navigateToFileCallbackDataSchema>['f'];
}

export interface FileRefreshCallbackData {
  source: z.infer<typeof fileRefreshCallbackDataSchema>['$'];
  fileId: z.infer<typeof fileRefreshCallbackDataSchema>['f'];
}

export interface DeleteFileCallbackData {
  source: z.infer<typeof deleteFileCallbackDataSchema>['$'];
  fileId: z.infer<typeof deleteFileCallbackDataSchema>['f'];
}

export interface DeleteFileConfirmCallbackData {
  source: z.infer<typeof deleteFileConfirmCallbackDataSchema>['$'];
  fileId: z.infer<typeof deleteFileConfirmCallbackDataSchema>['f'];
}

export interface BackToFilesListCallbackData {
  source: z.infer<typeof backToFilesListCallbackDataSchema>['$'];
  torrentId: z.infer<typeof backToFilesListCallbackDataSchema>['t'];
}

export interface AddTorrentCallbackData {
  source: z.infer<typeof addTorrentCallbackDataSchema>['$'];
}

export interface NavigateToTorrentCallbackData {
  source: z.infer<typeof navigateToTorrentCallbackDataSchema>['$'];
  torrentId: z.infer<typeof navigateToTorrentCallbackDataSchema>['t'];
}

export interface RutrackerSearchCallbackData {
  source: z.infer<typeof rutrackerSearchCallbackDataSchema>['$'];
}

export interface RutrackerSearchAddTorrentCallbackData {
  source: z.infer<typeof rutrackerSearchAddTorrentCallbackDataSchema>['$'];
  torrentId: z.infer<typeof rutrackerSearchAddTorrentCallbackDataSchema>['t'];
}

export type TorrentClientBeautifiedCallbackData =
  | StatusBackToStatusCallbackData
  | StatusRefreshCallbackData
  | StatusPauseCallbackData
  | StatusShowTorrentsListCallbackData
  | TorrentsListItemCallbackData
  | TorrentsListPageCallbackData
  | TorrentsListRefreshCallbackData
  | TorrentRefreshCallbackData
  | TorrentDeleteCallbackData
  | TorrentDeleteConfirmCallbackData
  | TorrentPauseCallbackData
  | TorrentSetCriticalCallbackData
  | TorrentBackToListCallbackData
  | TorrentShowFilesCallbackData
  | FilesListPageCallbackData
  | FilesListRefreshCallbackData
  | FilesListBackToTorrentCallbackData
  | NavigateToFileCallbackData
  | FileRefreshCallbackData
  | DeleteFileCallbackData
  | DeleteFileConfirmCallbackData
  | BackToFilesListCallbackData
  | AddTorrentCallbackData
  | NavigateToTorrentCallbackData
  | RutrackerSearchCallbackData
  | RutrackerSearchAddTorrentCallbackData;
