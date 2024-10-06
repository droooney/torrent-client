import { TelegramUserState } from '@prisma/client';
import rutrackerClient from 'rutracker-client/client';
import torrentClient from 'torrent-client/client';

import prisma from 'db/prisma';

import { MessageAction } from 'telegram-bot/types/actions';
import { TorrentClientCallbackButtonType } from 'telegram-bot/types/keyboard/torrent-client';

import MessageWithNotificationAction from 'telegram-bot/utilities/actions/MessageWithNotificationAction';
import RefreshDataAction from 'telegram-bot/utilities/actions/RefreshDataAction';
import { backCallbackButton } from 'telegram-bot/utilities/keyboard';
import CustomError, { ErrorCode } from 'utilities/CustomError';

import {
  getAddTorrentAction,
  getFileAction,
  getFilesAction,
  getStatusAction,
  getTorrentAction,
  getTorrentsListAction,
} from 'telegram-bot/actions/torrent-client';
import { callbackDataProvider, userDataProvider } from 'telegram-bot/bot';

callbackDataProvider.handle(
  [
    TorrentClientCallbackButtonType.TorrentsListItem,
    TorrentClientCallbackButtonType.NavigateToTorrent,
    TorrentClientCallbackButtonType.TorrentDelete,
    TorrentClientCallbackButtonType.FilesListBackToTorrent,
  ],
  async ({ data }) => {
    return getTorrentAction(data.torrentId, data.type === TorrentClientCallbackButtonType.TorrentDelete);
  },
);

callbackDataProvider.handle(TorrentClientCallbackButtonType.TorrentRefresh, async ({ data }) => {
  return new RefreshDataAction(await getTorrentAction(data.torrentId));
});

callbackDataProvider.handle(
  [
    TorrentClientCallbackButtonType.StatusShowTorrentsList,
    TorrentClientCallbackButtonType.TorrentsListPage,
    TorrentClientCallbackButtonType.TorrentBackToList,
  ],
  async ({ data }) => {
    return getTorrentsListAction('page' in data ? data.page : 0);
  },
);

callbackDataProvider.handle(TorrentClientCallbackButtonType.TorrentsListRefresh, async ({ data }) => {
  return new RefreshDataAction(await (await getTorrentsListAction(data.page)).generateMessageAction());
});

callbackDataProvider.handle(TorrentClientCallbackButtonType.TorrentDeleteConfirm, async ({ data }) => {
  await torrentClient.deleteTorrent(data.torrentId);

  return new MessageWithNotificationAction({
    text: 'Торрент успешно удален',
    updateAction: await (await getTorrentsListAction()).generateMessageAction(),
  });
});

callbackDataProvider.handle(TorrentClientCallbackButtonType.TorrentPause, async ({ data }) => {
  const { torrentId, pause } = data;

  if (pause) {
    await torrentClient.pauseTorrent(torrentId);
  } else {
    await torrentClient.unpauseTorrent(torrentId);
  }

  return new MessageWithNotificationAction({
    text: pause ? 'Торрент поставлен на паузу' : 'Торрент снят с паузы',
    updateAction: await getTorrentAction(torrentId),
  });
});

callbackDataProvider.handle(TorrentClientCallbackButtonType.TorrentSetCritical, async ({ data }) => {
  const { torrentId, critical } = data;

  await torrentClient.setCriticalTorrent(torrentId, critical);

  return new MessageWithNotificationAction({
    text: critical ? 'Торрент сделан критичным' : 'Торрент сделан некритичным',
    updateAction: await getTorrentAction(torrentId),
  });
});

callbackDataProvider.handle(TorrentClientCallbackButtonType.BackToStatus, async () => {
  return getStatusAction();
});

callbackDataProvider.handle(TorrentClientCallbackButtonType.StatusRefresh, async () => {
  return new RefreshDataAction(await getStatusAction());
});

callbackDataProvider.handle(TorrentClientCallbackButtonType.StatusPause, async ({ data }) => {
  const { pause } = data;

  if (pause) {
    await torrentClient.pause();
  } else {
    await torrentClient.unpause();
  }

  return new MessageWithNotificationAction({
    text: pause ? 'Клиент поставлен на паузу' : 'Клиент снят с паузы',
    updateAction: await getStatusAction(),
  });
});

callbackDataProvider.handle(TorrentClientCallbackButtonType.RutrackerSearchAddTorrent, async ({ data }) => {
  return getAddTorrentAction(() => rutrackerClient.addTorrent(data.torrentId));
});

callbackDataProvider.handle(TorrentClientCallbackButtonType.AddTorrent, async ({ user }) => {
  await userDataProvider.setUserData(user.id, {
    ...user.data,
    state: TelegramUserState.AddTorrent,
  });

  return new MessageAction({
    content: {
      type: 'text',
      text: 'Отправьте торрент или magnet-ссылку',
    },
    replyMarkup: [
      [
        backCallbackButton({
          type: TorrentClientCallbackButtonType.BackToStatus,
        }),
      ],
    ],
  });
});

callbackDataProvider.handle(
  [
    TorrentClientCallbackButtonType.TorrentShowFiles,
    TorrentClientCallbackButtonType.FilesListPage,
    TorrentClientCallbackButtonType.BackToFilesList,
  ],
  async ({ data }) => {
    return getFilesAction(data.torrentId, 'page' in data ? data.page : 0);
  },
);

callbackDataProvider.handle(TorrentClientCallbackButtonType.FilesListRefresh, async ({ data }) => {
  return new RefreshDataAction(await (await getFilesAction(data.torrentId, data.page)).generateMessageAction());
});

callbackDataProvider.handle(
  [TorrentClientCallbackButtonType.NavigateToFile, TorrentClientCallbackButtonType.DeleteFile],
  async ({ data }) => {
    return getFileAction(data.fileId, data.type === TorrentClientCallbackButtonType.DeleteFile);
  },
);

callbackDataProvider.handle(TorrentClientCallbackButtonType.FileRefresh, async ({ data }) => {
  return new RefreshDataAction(await getFileAction(data.fileId));
});

callbackDataProvider.handle(TorrentClientCallbackButtonType.DeleteFileConfirm, async ({ data }) => {
  const file = await prisma.torrentFile.findUnique({
    where: {
      id: data.fileId,
    },
  });

  if (!file) {
    throw new CustomError(ErrorCode.NOT_FOUND, 'Файл не найден');
  }

  await torrentClient.deleteFile(data.fileId);

  const torrent = await prisma.torrent.findUnique({
    where: {
      infoHash: file.torrentId,
    },
  });

  if (!torrent) {
    throw new CustomError(ErrorCode.NOT_FOUND, 'Торрент не найден');
  }

  return new MessageWithNotificationAction({
    text: 'Файл успешно удален',
    updateAction: await (await getFilesAction(torrent.infoHash)).generateMessageAction(),
  });
});

callbackDataProvider.handle(TorrentClientCallbackButtonType.RutrackerSearch, async ({ user }) => {
  await userDataProvider.setUserData(user.id, {
    ...user.data,
    state: TelegramUserState.SearchRutracker,
  });

  return new MessageAction({
    content: {
      type: 'text',
      text: 'Введите название для поиска на rutracker',
    },
    replyMarkup: [
      [
        backCallbackButton({
          type: TorrentClientCallbackButtonType.BackToStatus,
        }),
      ],
    ],
  });
});
