import { RootCallbackButtonType } from 'telegram-bot/types/keyboard/root';

import { getStatusAction as getDevicesStatusAction } from 'telegram-bot/actions/devices-client';
import { getRootAction } from 'telegram-bot/actions/root';
import { getStatusAction as getSystemStatusAction } from 'telegram-bot/actions/system';
import { getStatusAction as getTorrentClientStatusAction } from 'telegram-bot/actions/torrent-client';
import { callbackDataProvider } from 'telegram-bot/bot';

callbackDataProvider.handle(RootCallbackButtonType.BackToRoot, async () => {
  return getRootAction();
});

callbackDataProvider.handle(RootCallbackButtonType.OpenSystem, async () => {
  return getSystemStatusAction();
});

callbackDataProvider.handle(RootCallbackButtonType.OpenDevices, async () => {
  return getDevicesStatusAction();
});

callbackDataProvider.handle(RootCallbackButtonType.OpenTorrentClient, async () => {
  return getTorrentClientStatusAction();
});
