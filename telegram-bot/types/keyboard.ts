import { z } from 'zod';

export type InlineKeyboard = ((InlineKeyboardButton | null | undefined | false)[] | null | undefined | false)[];

export enum CallbackButtonSource {
  // Root
  ROOT_BACK_TO_ROOT = 16,
  ROOT_OPEN_SYSTEM = 14,
  ROOT_OPEN_TORRENT_CLIENT = 15,

  // System

  // Torrent client
  // Torrent client: status
  TORRENT_CLIENT_BACK_TO_STATUS = 17,
  TORRENT_CLIENT_STATUS_REFRESH = 9,
  TORRENT_CLIENT_STATUS_PAUSE = 10,
  TORRENT_CLIENT_STATUS_SHOW_TORRENTS_LIST = 13,

  // Torrent client: list
  TORRENT_CLIENT_TORRENTS_LIST_ITEM = 0,
  TORRENT_CLIENT_TORRENTS_LIST_PAGE = 1,
  TORRENT_CLIENT_TORRENTS_LIST_REFRESH = 7,

  // Torrent client: torrent
  TORRENT_CLIENT_TORRENT_REFRESH = 6,
  TORRENT_CLIENT_TORRENT_DELETE = 2,
  TORRENT_CLIENT_TORRENT_DELETE_CONFIRM = 8,
  TORRENT_CLIENT_TORRENT_PAUSE = 3,
  TORRENT_CLIENT_TORRENT_SET_CRITICAL = 4,
  TORRENT_CLIENT_TORRENT_BACK_TO_LIST = 5,
  TORRENT_CLIENT_TORRENT_SHOW_FILES = 19,

  // Torrent client: file list
  TORRENT_CLIENT_TORRENT_FILES_PAGE = 20,
  TORRENT_CLIENT_TORRENT_FILES_REFRESH = 21,
  TORRENT_CLIENT_BACK_TO_TORRENT = 22,
  TORRENT_CLIENT_TORRENT_NAVIGATE_TO_FILE = 23,

  // Torrent client: file
  TORRENT_FILE_REFRESH = 27,
  TORRENT_CLIENT_DELETE_FILE = 24,
  TORRENT_CLIENT_DELETE_FILE_CONFIRM = 26,
  TORRENT_CLIENT_BACK_TO_FILES = 25,

  // Torrent client: misc
  TORRENT_CLIENT_ADD_TORRENT = 18,
  TORRENT_CLIENT_NAVIGATE_TO_TORRENT = 11,

  // Torrent client: rutracker
  TORRENT_CLIENT_RUTRACKER_SEARCH_ADD_TORRENT = 12,
}

const binarySchema = z.union([z.literal(0), z.literal(1)]);

export const backToRootCallbackDataSchema = z.object({
  $: z.literal(CallbackButtonSource.ROOT_BACK_TO_ROOT),
});

export const openSystemCallbackDataSchema = z.object({
  $: z.literal(CallbackButtonSource.ROOT_OPEN_SYSTEM),
});

export const openTorrentClientCallbackDataSchema = z.object({
  $: z.literal(CallbackButtonSource.ROOT_OPEN_TORRENT_CLIENT),
});

export const statusBackToStatusCallbackDataSchema = z.object({
  $: z.literal(CallbackButtonSource.TORRENT_CLIENT_BACK_TO_STATUS),
});

export const statusRefreshCallbackDataSchema = z.object({
  $: z.literal(CallbackButtonSource.TORRENT_CLIENT_STATUS_REFRESH),
});

export const statusPauseCallbackDataSchema = z.object({
  $: z.literal(CallbackButtonSource.TORRENT_CLIENT_STATUS_PAUSE),
  p: binarySchema,
});

export const statusShowTorrentsListCallbackDataSchema = z.object({
  $: z.literal(CallbackButtonSource.TORRENT_CLIENT_STATUS_SHOW_TORRENTS_LIST),
});

export const torrentsListItemCallbackDataSchema = z.object({
  $: z.literal(CallbackButtonSource.TORRENT_CLIENT_TORRENTS_LIST_ITEM),
  t: z.string(),
});

export const torrentsListPageCallbackDataSchema = z.object({
  $: z.literal(CallbackButtonSource.TORRENT_CLIENT_TORRENTS_LIST_PAGE),
  p: z.number(),
});

export const torrentsListRefreshCallbackDataSchema = z.object({
  $: z.literal(CallbackButtonSource.TORRENT_CLIENT_TORRENTS_LIST_REFRESH),
  p: z.number(),
});

export const torrentRefreshCallbackDataSchema = z.object({
  $: z.literal(CallbackButtonSource.TORRENT_CLIENT_TORRENT_REFRESH),
  t: z.string(),
});

export const torrentDeleteCallbackDataSchema = z.object({
  $: z.literal(CallbackButtonSource.TORRENT_CLIENT_TORRENT_DELETE),
  t: z.string(),
});

export const torrentDeleteConfirmCallbackDataSchema = z.object({
  $: z.literal(CallbackButtonSource.TORRENT_CLIENT_TORRENT_DELETE_CONFIRM),
  t: z.string(),
});

export const torrentPauseCallbackDataSchema = z.object({
  $: z.literal(CallbackButtonSource.TORRENT_CLIENT_TORRENT_PAUSE),
  t: z.string(),
  p: binarySchema,
});

export const torrentSetCriticalCallbackDataSchema = z.object({
  $: z.literal(CallbackButtonSource.TORRENT_CLIENT_TORRENT_SET_CRITICAL),
  t: z.string(),
  c: binarySchema,
});

export const torrentBackToListCallbackDataSchema = z.object({
  $: z.literal(CallbackButtonSource.TORRENT_CLIENT_TORRENT_BACK_TO_LIST),
});

export const torrentShowFilesCallbackDataSchema = z.object({
  $: z.literal(CallbackButtonSource.TORRENT_CLIENT_TORRENT_SHOW_FILES),
  t: z.string(),
});

export const torrentFilesPageCallbackDataSchema = z.object({
  $: z.literal(CallbackButtonSource.TORRENT_CLIENT_TORRENT_FILES_PAGE),
  t: z.string(),
  p: z.number(),
});

export const torrentFilesRefreshCallbackDataSchema = z.object({
  $: z.literal(CallbackButtonSource.TORRENT_CLIENT_TORRENT_FILES_REFRESH),
  t: z.string(),
  p: z.number(),
});

export const torrentBackToTorrentCallbackDataSchema = z.object({
  $: z.literal(CallbackButtonSource.TORRENT_CLIENT_BACK_TO_TORRENT),
  t: z.string(),
});

export const torrentNavigateToFileCallbackDataSchema = z.object({
  $: z.literal(CallbackButtonSource.TORRENT_CLIENT_TORRENT_NAVIGATE_TO_FILE),
  f: z.number(),
});

export const torrentFileRefreshCallbackDataSchema = z.object({
  $: z.literal(CallbackButtonSource.TORRENT_FILE_REFRESH),
  f: z.number(),
});

export const torrentDeleteFileCallbackDataSchema = z.object({
  $: z.literal(CallbackButtonSource.TORRENT_CLIENT_DELETE_FILE),
  f: z.number(),
});

export const torrentDeleteFileConfirmCallbackDataSchema = z.object({
  $: z.literal(CallbackButtonSource.TORRENT_CLIENT_DELETE_FILE_CONFIRM),
  f: z.number(),
});

export const torrentBackToFilesCallbackDataSchema = z.object({
  $: z.literal(CallbackButtonSource.TORRENT_CLIENT_BACK_TO_FILES),
  t: z.string(),
});

export const addTorrentCallbackDataSchema = z.object({
  $: z.literal(CallbackButtonSource.TORRENT_CLIENT_ADD_TORRENT),
});

export const navigateToTorrentCallbackDataSchema = z.object({
  $: z.literal(CallbackButtonSource.TORRENT_CLIENT_NAVIGATE_TO_TORRENT),
  t: z.string(),
});

export const rutrackerSearchAddTorrentCallbackDataSchema = z.object({
  $: z.literal(CallbackButtonSource.TORRENT_CLIENT_RUTRACKER_SEARCH_ADD_TORRENT),
  t: z.string(),
});

export const callbackDataSchema = z.union([
  backToRootCallbackDataSchema,
  openSystemCallbackDataSchema,
  openTorrentClientCallbackDataSchema,
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
  torrentFilesPageCallbackDataSchema,
  torrentFilesRefreshCallbackDataSchema,
  torrentBackToTorrentCallbackDataSchema,
  torrentNavigateToFileCallbackDataSchema,
  torrentFileRefreshCallbackDataSchema,
  torrentDeleteFileCallbackDataSchema,
  torrentDeleteFileConfirmCallbackDataSchema,
  torrentBackToFilesCallbackDataSchema,
  addTorrentCallbackDataSchema,
  navigateToTorrentCallbackDataSchema,
  rutrackerSearchAddTorrentCallbackDataSchema,
]);

export type UglifiedCallbackData = z.infer<typeof callbackDataSchema>;

export type UglifiedCallbackDataBySource<Source extends CallbackButtonSource> = Extract<
  UglifiedCallbackData,
  { $: Source }
>;

export type UglifiedCallbackDataSourceWithData = {
  [Source in CallbackButtonSource]: Exclude<keyof UglifiedCallbackDataBySource<Source>, '$'> extends never
    ? never
    : Source;
}[CallbackButtonSource];

export interface BackToRootCallbackData {
  source: z.infer<typeof backToRootCallbackDataSchema>['$'];
}

export interface OpenSystemCallbackData {
  source: z.infer<typeof openSystemCallbackDataSchema>['$'];
}

export interface OpenTorrentClientCallbackData {
  source: z.infer<typeof openTorrentClientCallbackDataSchema>['$'];
}

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

export interface TorrentFilesPageCallbackData {
  source: z.infer<typeof torrentFilesPageCallbackDataSchema>['$'];
  torrentId: z.infer<typeof torrentFilesPageCallbackDataSchema>['t'];
  page: z.infer<typeof torrentFilesPageCallbackDataSchema>['p'];
}

export interface TorrentFilesRefreshCallbackData {
  source: z.infer<typeof torrentFilesRefreshCallbackDataSchema>['$'];
  torrentId: z.infer<typeof torrentFilesRefreshCallbackDataSchema>['t'];
  page: z.infer<typeof torrentFilesRefreshCallbackDataSchema>['p'];
}

export interface TorrentBackToTorrentCallbackData {
  source: z.infer<typeof torrentBackToTorrentCallbackDataSchema>['$'];
  torrentId: z.infer<typeof torrentBackToTorrentCallbackDataSchema>['t'];
}

export interface TorrentNavigateToFileCallbackData {
  source: z.infer<typeof torrentNavigateToFileCallbackDataSchema>['$'];
  fileId: z.infer<typeof torrentNavigateToFileCallbackDataSchema>['f'];
}

export interface TorrentFileRefreshCallbackData {
  source: z.infer<typeof torrentFileRefreshCallbackDataSchema>['$'];
  fileId: z.infer<typeof torrentFileRefreshCallbackDataSchema>['f'];
}

export interface TorrentDeleteFileCallbackData {
  source: z.infer<typeof torrentDeleteFileCallbackDataSchema>['$'];
  fileId: z.infer<typeof torrentDeleteFileCallbackDataSchema>['f'];
}

export interface TorrentDeleteFileConfirmCallbackData {
  source: z.infer<typeof torrentDeleteFileConfirmCallbackDataSchema>['$'];
  fileId: z.infer<typeof torrentDeleteFileConfirmCallbackDataSchema>['f'];
}

export interface TorrentBackToFilesCallbackData {
  source: z.infer<typeof torrentBackToFilesCallbackDataSchema>['$'];
  torrentId: z.infer<typeof torrentBackToFilesCallbackDataSchema>['t'];
}

export interface AddTorrentCallbackData {
  source: z.infer<typeof addTorrentCallbackDataSchema>['$'];
}

export interface NavigateToTorrentCallbackData {
  source: z.infer<typeof navigateToTorrentCallbackDataSchema>['$'];
  torrentId: z.infer<typeof navigateToTorrentCallbackDataSchema>['t'];
}

export interface RutrackerSearchAddTorrentCallbackData {
  source: z.infer<typeof rutrackerSearchAddTorrentCallbackDataSchema>['$'];
  torrentId: z.infer<typeof rutrackerSearchAddTorrentCallbackDataSchema>['t'];
}

export type BeautifiedCallbackData =
  | BackToRootCallbackData
  | OpenSystemCallbackData
  | OpenTorrentClientCallbackData
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
  | TorrentFilesPageCallbackData
  | TorrentFilesRefreshCallbackData
  | TorrentBackToTorrentCallbackData
  | TorrentNavigateToFileCallbackData
  | TorrentFileRefreshCallbackData
  | TorrentDeleteFileCallbackData
  | TorrentDeleteFileConfirmCallbackData
  | TorrentBackToFilesCallbackData
  | AddTorrentCallbackData
  | NavigateToTorrentCallbackData
  | RutrackerSearchAddTorrentCallbackData;

export type BeautifiedCallbackDataBySource<Source extends CallbackButtonSource> = Extract<
  BeautifiedCallbackData,
  { source: Source }
>;

export type BeautifiedCallbackDataSourceWithData = {
  [Source in CallbackButtonSource]: Exclude<keyof BeautifiedCallbackDataBySource<Source>, 'source'> extends never
    ? never
    : Source;
}[CallbackButtonSource];

export interface BaseInlineKeyboardButton {
  // TODO: add icon
  text: string;
}

export interface CallbackInlineKeyboardButton extends BaseInlineKeyboardButton {
  type: 'callback';
  callbackData: BeautifiedCallbackData;
}

export interface UrlInlineKeyboardButton extends BaseInlineKeyboardButton {
  type: 'url';
  url: string;
}

export type InlineKeyboardButton = CallbackInlineKeyboardButton | UrlInlineKeyboardButton;
