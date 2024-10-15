import { Prisma, TelegramUserData } from '@prisma/client';
import { JsonStorageCallbackDataProvider, JsonUserDataProvider, TelegramBot } from '@tg-sensei/bot';

import prisma from 'db/prisma';

import { MessageAction, NotificationAction } from 'telegram-bot/types/actions';
import { CommandType } from 'telegram-bot/types/commands';
import { CallbackData, callbackDataSchema } from 'telegram-bot/types/keyboard';

import CustomError, { ErrorCode } from 'utilities/CustomError';
import { prepareErrorForHuman } from 'utilities/error';

if (!process.env.TELEGRAM_BOT_TOKEN) {
  console.error('No telegram bot token');

  process.exit(1);
}

export type UserData = Omit<TelegramUserData, 'telegramUserId'>;

export const callbackDataProvider = new JsonStorageCallbackDataProvider<CommandType, CallbackData, UserData>({
  getData: async (dataId) => {
    const found = await prisma.telegramCallbackData.findFirst({
      where: {
        dataId,
      },
    });

    if (!found) {
      throw new CustomError(ErrorCode.EXPIRED, 'Данные устарели');
    }

    const parsed = callbackDataSchema.safeParse(found.data);

    if (!parsed.success) {
      throw new CustomError(ErrorCode.UNSUPPORTED, 'Не поддерживается');
    }

    return parsed.data;
  },
  setData: async (dataId, data) => {
    if (data) {
      await prisma.telegramCallbackData.create({
        data: {
          dataId,
          data,
        },
      });
    } else {
      await prisma.telegramCallbackData.delete({
        where: {
          dataId,
        },
      });
    }
  },
  clearData: async () => {
    await prisma.telegramCallbackData.deleteMany();
  },
});

export const userDataProvider = new JsonUserDataProvider<CommandType, CallbackData, UserData>({
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
        addDevicePayload: data.addDevicePayload ?? Prisma.DbNull,
        editDevicePayload: data.editDevicePayload ?? Prisma.DbNull,
      },
    });
  },
});

const bot = new TelegramBot<CommandType, CallbackData, UserData>({
  token: process.env.TELEGRAM_BOT_TOKEN,
  usernameWhitelist: process.env.USERNAME_WHITELIST?.split(',').filter(Boolean) ?? [],
  commands: {
    [CommandType.Help]: 'Помощь',
  },
  callbackDataProvider,
  userDataProvider,
  getCallbackQueryErrorAction: ({ err }) =>
    new NotificationAction({
      text: prepareErrorForHuman(err),
    }),
  getMessageErrorAction: ({ err }) =>
    new MessageAction({
      content: {
        type: 'text',
        text: prepareErrorForHuman(err),
      },
    }),
});

export default bot;
