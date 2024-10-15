import { z } from 'zod';

// next number is 26
export enum TorrentClientCallbackButtonType {
  // Status
  OpenStatus = 't0',
  PauseClient = 't2',

  // Torrent list
  OpenTorrentsList = 't3',

  // Torrent
  OpenTorrent = 't23',
  TorrentDeleteConfirm = 't9',
  TorrentPause = 't10',
  TorrentSetCritical = 't11',

  // File list
  OpenFiles = 't13',

  // File
  OpenFile = 't17',
  DeleteFileConfirm = 't20',

  // Misc
  AddTorrent = 't22',

  // Rutracker
  RutrackerSearch = 't25',
  RutrackerSearchAddTorrent = 't24',
}

export const torrentClientCallbackDataSchema = z.union([
  z.object({
    type: z.literal(TorrentClientCallbackButtonType.OpenStatus),
    isRefresh: z.optional(z.boolean()),
  }),

  z.object({
    type: z.literal(TorrentClientCallbackButtonType.PauseClient),
    pause: z.boolean(),
  }),

  z.object({
    type: z.literal(TorrentClientCallbackButtonType.OpenTorrentsList),
    page: z.optional(z.number()),
    isRefresh: z.optional(z.boolean()),
  }),

  z.object({
    type: z.literal(TorrentClientCallbackButtonType.OpenTorrent),
    torrentId: z.string(),
    withDeleteConfirm: z.optional(z.boolean()),
    isRefresh: z.optional(z.boolean()),
  }),

  z.object({
    type: z.literal(TorrentClientCallbackButtonType.TorrentDeleteConfirm),
    torrentId: z.string(),
  }),

  z.object({
    type: z.literal(TorrentClientCallbackButtonType.TorrentPause),
    torrentId: z.string(),
    pause: z.boolean(),
  }),

  z.object({
    type: z.literal(TorrentClientCallbackButtonType.TorrentSetCritical),
    torrentId: z.string(),
    critical: z.boolean(),
  }),

  z.object({
    type: z.literal(TorrentClientCallbackButtonType.OpenFiles),
    torrentId: z.string(),
    page: z.optional(z.number()),
    isRefresh: z.optional(z.boolean()),
  }),

  z.object({
    type: z.literal(TorrentClientCallbackButtonType.OpenFile),
    fileId: z.number(),
    withDeleteConfirm: z.optional(z.boolean()),
    isRefresh: z.optional(z.boolean()),
  }),

  z.object({
    type: z.literal(TorrentClientCallbackButtonType.DeleteFileConfirm),
    fileId: z.number(),
  }),

  z.object({
    type: z.literal(TorrentClientCallbackButtonType.AddTorrent),
  }),

  z.object({
    type: z.literal(TorrentClientCallbackButtonType.RutrackerSearch),
  }),

  z.object({
    type: z.literal(TorrentClientCallbackButtonType.RutrackerSearchAddTorrent),
    torrentId: z.string(),
  }),
]);
