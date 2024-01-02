import { z } from 'zod';

export enum RootCallbackButtonSource {
  BACK_TO_ROOT = 'r0',
  OPEN_SYSTEM = 'r1',
  OPEN_TORRENT_CLIENT = 'r2',
}

export const backToRootCallbackDataSchema = z.object({
  $: z.literal(RootCallbackButtonSource.BACK_TO_ROOT),
});

export const openSystemCallbackDataSchema = z.object({
  $: z.literal(RootCallbackButtonSource.OPEN_SYSTEM),
});

export const openTorrentClientCallbackDataSchema = z.object({
  $: z.literal(RootCallbackButtonSource.OPEN_TORRENT_CLIENT),
});

export const rootCallbackDataSchema = z.union([
  backToRootCallbackDataSchema,
  openSystemCallbackDataSchema,
  openTorrentClientCallbackDataSchema,
]);

export interface BackToRootCallbackData {
  source: z.infer<typeof backToRootCallbackDataSchema>['$'];
}

export interface OpenSystemCallbackData {
  source: z.infer<typeof openSystemCallbackDataSchema>['$'];
}

export interface OpenTorrentClientCallbackData {
  source: z.infer<typeof openTorrentClientCallbackDataSchema>['$'];
}

export type RootBeautifiedCallbackData =
  | BackToRootCallbackData
  | OpenSystemCallbackData
  | OpenTorrentClientCallbackData;
