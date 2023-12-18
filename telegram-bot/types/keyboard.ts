import { z } from 'zod';

export type InlineKeyboard = InlineKeyboardButton[][];

export enum CallbackButtonSource {
  TORRENTS_LIST_ITEM = 0,
  TORRENTS_LIST_PAGE = 1,
  TORRENTS_LIST_REFRESH = 7,
  TORRENT_REFRESH = 6,
  TORRENT_DELETE = 2,
  TORRENT_DELETE_CONFIRM = 8,
  TORRENT_PAUSE = 3,
  TORRENT_SET_CRITICAL = 4,
  TORRENT_BACK_TO_LIST = 5,
  STATUS_REFRESH = 9,
  STATUS_PAUSE = 10,
  NAVIGATE_TO_TORRENT = 11,
  RUTRACKER_SEARCH_ADD_TORRENT = 12,
}

const binarySchema = z.union([z.literal(0), z.literal(1)]);

export const torrentsListItemCallbackDataSchema = z.object({
  $: z.literal(CallbackButtonSource.TORRENTS_LIST_ITEM),
  t: z.string(),
});

export const torrentsListPageCallbackDataSchema = z.object({
  $: z.literal(CallbackButtonSource.TORRENTS_LIST_PAGE),
  p: z.number(),
});

export const torrentsListRefreshCallbackDataSchema = z.object({
  $: z.literal(CallbackButtonSource.TORRENTS_LIST_REFRESH),
  p: z.number(),
});

export const torrentRefreshCallbackDataSchema = z.object({
  $: z.literal(CallbackButtonSource.TORRENT_REFRESH),
  t: z.string(),
});

export const torrentDeleteCallbackDataSchema = z.object({
  $: z.literal(CallbackButtonSource.TORRENT_DELETE),
  t: z.string(),
});

export const torrentDeleteConfirmCallbackDataSchema = z.object({
  $: z.literal(CallbackButtonSource.TORRENT_DELETE_CONFIRM),
  t: z.string(),
});

export const torrentPauseCallbackDataSchema = z.object({
  $: z.literal(CallbackButtonSource.TORRENT_PAUSE),
  t: z.string(),
  p: binarySchema,
});

export const torrentSetCriticalCallbackDataSchema = z.object({
  $: z.literal(CallbackButtonSource.TORRENT_SET_CRITICAL),
  t: z.string(),
  c: binarySchema,
});

export const torrentBackToListCallbackDataSchema = z.object({
  $: z.literal(CallbackButtonSource.TORRENT_BACK_TO_LIST),
});

export const statusRefreshCallbackDataSchema = z.object({
  $: z.literal(CallbackButtonSource.STATUS_REFRESH),
});

export const statusPauseCallbackDataSchema = z.object({
  $: z.literal(CallbackButtonSource.STATUS_PAUSE),
  p: binarySchema,
});

export const navigateToTorrentCallbackDataSchema = z.object({
  $: z.literal(CallbackButtonSource.NAVIGATE_TO_TORRENT),
  t: z.string(),
});

export const rutrackerSearchAddTorrentCallbackDataSchema = z.object({
  $: z.literal(CallbackButtonSource.RUTRACKER_SEARCH_ADD_TORRENT),
  t: z.string(),
});

export const callbackDataSchema = z.union([
  torrentsListItemCallbackDataSchema,
  torrentsListPageCallbackDataSchema,
  torrentsListRefreshCallbackDataSchema,
  torrentRefreshCallbackDataSchema,
  torrentDeleteCallbackDataSchema,
  torrentDeleteConfirmCallbackDataSchema,
  torrentPauseCallbackDataSchema,
  torrentSetCriticalCallbackDataSchema,
  torrentBackToListCallbackDataSchema,
  statusRefreshCallbackDataSchema,
  statusPauseCallbackDataSchema,
  navigateToTorrentCallbackDataSchema,
  rutrackerSearchAddTorrentCallbackDataSchema,
]);

export type UglifiedCallbackData = z.infer<typeof callbackDataSchema>;

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

export interface StatusRefreshCallbackData {
  source: z.infer<typeof statusRefreshCallbackDataSchema>['$'];
}

export interface StatusPauseCallbackData {
  source: z.infer<typeof statusPauseCallbackDataSchema>['$'];
  pause: boolean;
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
  | TorrentsListItemCallbackData
  | TorrentsListPageCallbackData
  | TorrentsListRefreshCallbackData
  | TorrentRefreshCallbackData
  | TorrentDeleteCallbackData
  | TorrentDeleteConfirmCallbackData
  | TorrentPauseCallbackData
  | TorrentSetCriticalCallbackData
  | TorrentBackToListCallbackData
  | StatusRefreshCallbackData
  | StatusPauseCallbackData
  | NavigateToTorrentCallbackData
  | RutrackerSearchAddTorrentCallbackData;

export type BeautifiedCallbackDataBySource<Source extends CallbackButtonSource> = Extract<
  BeautifiedCallbackData,
  { source: Source }
>;

export interface BaseInlineKeyboardButton {
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
