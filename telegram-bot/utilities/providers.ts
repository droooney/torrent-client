import { Prisma } from '@prisma/client';
import { AnyUpdateContext, JsonUserDataProvider } from '@tg-sensei/bot';

import prisma from 'db/prisma';

import { UserData } from 'telegram-bot/bot';

export function getUserDataProvider<InputContext extends AnyUpdateContext>(): JsonUserDataProvider<
  UserData,
  InputContext
> {
  return new JsonUserDataProvider<UserData, InputContext>({
    getOrCreateUserData: async (userId) =>
      prisma.telegramUserData.upsert({
        where: {
          telegramUserId: userId,
        },
        update: {},
        create: {
          telegramUserId: userId,
          state: 'First',
        },
      }),
    setUserData: async (userId, data) => {
      await prisma.telegramUserData.update({
        where: {
          telegramUserId: userId,
        },
        data: {
          ...data,
          editScenarioPayload: data.editScenarioPayload ?? Prisma.DbNull,
          addScenarioStepPayload: data.addScenarioStepPayload ?? Prisma.DbNull,
          addScenarioTriggerPayload: data.addScenarioTriggerPayload ?? Prisma.DbNull,
          addDevicePayload: data.addDevicePayload ?? Prisma.DbNull,
          editDevicePayload: data.editDevicePayload ?? Prisma.DbNull,
        },
      });
    },
  });
}
