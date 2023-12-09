import { z } from 'zod';

export type InlineKeyboard = InlineKeyboardButton[][];

export enum CallbackButtonSource {
  TORRENTS_LIST_ITEM,
  TORRENTS_LIST_PAGE,
  TORRENT_DELETE,
  TORRENT_PAUSE,
  TORRENT_SET_CRITICAL,
  TORRENT_BACK_TO_LIST,
  TORRENT_REFRESH,
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

export const torrentDeleteCallbackDataSchema = z.object({
  $: z.literal(CallbackButtonSource.TORRENT_DELETE),
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

export const torrentRefreshCallbackDataSchema = z.object({
  $: z.literal(CallbackButtonSource.TORRENT_REFRESH),
  t: z.string(),
});

export const callbackDataSchema = z.union([
  torrentsListItemCallbackDataSchema,
  torrentsListPageCallbackDataSchema,
  torrentDeleteCallbackDataSchema,
  torrentPauseCallbackDataSchema,
  torrentSetCriticalCallbackDataSchema,
  torrentBackToListCallbackDataSchema,
  torrentRefreshCallbackDataSchema,
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

export interface TorrentDeleteCallbackData {
  source: z.infer<typeof torrentDeleteCallbackDataSchema>['$'];
  torrentId: z.infer<typeof torrentDeleteCallbackDataSchema>['t'];
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

export interface TorrentRefreshCallbackData {
  source: z.infer<typeof torrentRefreshCallbackDataSchema>['$'];
  torrentId: z.infer<typeof torrentRefreshCallbackDataSchema>['t'];
}

export type BeautifiedCallbackData =
  | TorrentsListItemCallbackData
  | TorrentsListPageCallbackData
  | TorrentDeleteCallbackData
  | TorrentPauseCallbackData
  | TorrentSetCriticalCallbackData
  | TorrentBackToListCallbackData
  | TorrentRefreshCallbackData;

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
