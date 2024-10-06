import { TelegramUserState } from '@prisma/client';

import { getRootAction } from 'telegram-bot/actions/root';
import { userDataProvider } from 'telegram-bot/bot';

userDataProvider.handle(TelegramUserState.First, async ({ user }) => {
  await userDataProvider.setUserData(user.id, {
    ...user.data,
    state: TelegramUserState.Waiting,
  });

  return getRootAction();
});
