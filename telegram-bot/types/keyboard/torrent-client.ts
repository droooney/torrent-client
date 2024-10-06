import { z } from 'zod';

export enum TorrentClientCallbackButtonType {
  // Status
  BackToStatus = 't0',
  StatusRefresh = 't1',
  StatusPause = 't2',
  StatusShowTorrentsList = 't3',

  // Torrent list
  TorrentsListItem = 't4',
  TorrentsListPage = 't5',
  TorrentsListRefresh = 't6',

  // Torrent
  TorrentRefresh = 't7',
  TorrentDelete = 't8',
  TorrentDeleteConfirm = 't9',
  TorrentPause = 't10',
  TorrentSetCritical = 't11',
  TorrentBackToList = 't12',
  TorrentShowFiles = 't13',

  // File list
  FilesListPage = 't14',
  FilesListRefresh = 't15',
  FilesListBackToTorrent = 't16',
  NavigateToFile = 't17',

  // File
  FileRefresh = 't18',
  DeleteFile = 't19',
  DeleteFileConfirm = 't20',
  BackToFilesList = 't21',

  // Misc
  AddTorrent = 't22',
  NavigateToTorrent = 't23',

  // Rutracker
  RutrackerSearch = 't25',
  RutrackerSearchAddTorrent = 't24',
}

export const torrentClientCallbackDataSchema = z.union([
  z.object({
    type: z.literal(TorrentClientCallbackButtonType.BackToStatus),
  }),

  z.object({
    type: z.literal(TorrentClientCallbackButtonType.StatusRefresh),
  }),

  z.object({
    type: z.literal(TorrentClientCallbackButtonType.StatusPause),
    pause: z.boolean(),
  }),

  z.object({
    type: z.literal(TorrentClientCallbackButtonType.StatusShowTorrentsList),
  }),

  z.object({
    type: z.literal(TorrentClientCallbackButtonType.TorrentsListItem),
    torrentId: z.string(),
  }),

  z.object({
    type: z.literal(TorrentClientCallbackButtonType.TorrentsListPage),
    page: z.number(),
  }),

  z.object({
    type: z.literal(TorrentClientCallbackButtonType.TorrentsListRefresh),
    page: z.number(),
  }),

  z.object({
    type: z.literal(TorrentClientCallbackButtonType.TorrentRefresh),
    torrentId: z.string(),
  }),

  z.object({
    type: z.literal(TorrentClientCallbackButtonType.TorrentDelete),
    torrentId: z.string(),
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
    type: z.literal(TorrentClientCallbackButtonType.TorrentBackToList),
  }),

  z.object({
    type: z.literal(TorrentClientCallbackButtonType.TorrentShowFiles),
    torrentId: z.string(),
  }),

  z.object({
    type: z.literal(TorrentClientCallbackButtonType.FilesListPage),
    torrentId: z.string(),
    page: z.number(),
  }),

  z.object({
    type: z.literal(TorrentClientCallbackButtonType.FilesListRefresh),
    torrentId: z.string(),
    page: z.number(),
  }),

  z.object({
    type: z.literal(TorrentClientCallbackButtonType.FilesListBackToTorrent),
    torrentId: z.string(),
  }),

  z.object({
    type: z.literal(TorrentClientCallbackButtonType.NavigateToFile),
    fileId: z.number(),
  }),

  z.object({
    type: z.literal(TorrentClientCallbackButtonType.FileRefresh),
    fileId: z.number(),
  }),

  z.object({
    type: z.literal(TorrentClientCallbackButtonType.DeleteFile),
    fileId: z.number(),
  }),

  z.object({
    type: z.literal(TorrentClientCallbackButtonType.DeleteFileConfirm),
    fileId: z.number(),
  }),

  z.object({
    type: z.literal(TorrentClientCallbackButtonType.BackToFilesList),
    torrentId: z.string(),
  }),

  z.object({
    type: z.literal(TorrentClientCallbackButtonType.AddTorrent),
  }),

  z.object({
    type: z.literal(TorrentClientCallbackButtonType.NavigateToTorrent),
    torrentId: z.string(),
  }),

  z.object({
    type: z.literal(TorrentClientCallbackButtonType.RutrackerSearch),
  }),

  z.object({
    type: z.literal(TorrentClientCallbackButtonType.RutrackerSearchAddTorrent),
    torrentId: z.string(),
  }),
]);
