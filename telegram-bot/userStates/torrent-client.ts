import { TelegramUserState } from '@prisma/client';
import torrentClient from 'torrent-client/client';

import { MessageAction } from 'telegram-bot/types/actions';

import { tryLoadTorrentDocument } from 'telegram-bot/utilities/documents';
import CustomError, { ErrorCode } from 'utilities/CustomError';
import { formatSpeed, parseSize } from 'utilities/size';

import { getAddTorrentAction, getSearchRutrackerAction } from 'telegram-bot/actions/torrent-client';
import { userDataProvider } from 'telegram-bot/bot';

userDataProvider.handle(TelegramUserState.SearchRutracker, async ({ message, user }) => {
  await userDataProvider.setUserData(user.id, {
    ...user.data,
    state: TelegramUserState.Waiting,
  });

  return getSearchRutrackerAction(message.text ?? '');
});

userDataProvider.handle(TelegramUserState.AddTorrent, async ({ message, user }) => {
  const { text } = message;

  await userDataProvider.setUserData(user.id, {
    ...user.data,
    state: TelegramUserState.Waiting,
  });

  return getAddTorrentAction(async () => {
    let torrent = await tryLoadTorrentDocument(message);

    if (!torrent && text) {
      torrent = await torrentClient.addTorrent({
        type: 'magnet',
        magnet: text,
      });
    }

    return torrent;
  });
});

userDataProvider.handle(TelegramUserState.SetDownloadLimit, async ({ message, user }) => {
  const { text } = message;

  const downloadLimit = text === '-' ? '-' : parseSize(text ?? '');

  if (downloadLimit === null) {
    throw new CustomError(ErrorCode.WRONG_FORMAT, 'Ошибка формата данных');
  }

  await userDataProvider.setUserData(user.id, {
    ...user.data,
    state: TelegramUserState.Waiting,
  });

  await torrentClient.setDownloadSpeedLimit(downloadLimit === '-' ? null : downloadLimit);

  return new MessageAction({
    content: {
      type: 'text',
      text:
        downloadLimit === '-'
          ? 'Ограничение загрузки снято'
          : `Выставлено ограничение загрузки ${formatSpeed(downloadLimit)}`,
    },
  });
});

userDataProvider.handle(TelegramUserState.SetUploadLimit, async ({ message, user }) => {
  const { text } = message;

  const uploadLimit = text === '-' ? '-' : parseSize(text ?? '');

  if (uploadLimit === null) {
    throw new CustomError(ErrorCode.WRONG_FORMAT, 'Ошибка формата данных');
  }

  await userDataProvider.setUserData(user.id, {
    ...user.data,
    state: TelegramUserState.Waiting,
  });

  await torrentClient.setUploadSpeedLimit(uploadLimit === '-' ? null : uploadLimit);

  return new MessageAction({
    content: {
      type: 'text',
      text:
        uploadLimit === '-' ? 'Ограничение отдачи снято' : `Выставлено ограничение отдачи ${formatSpeed(uploadLimit)}`,
    },
  });
});
