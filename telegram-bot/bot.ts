import { TelegramUserData, TelegramUserState } from '@prisma/client';
import {
  CommandsProvider,
  JsonStorageCallbackDataProvider,
  MessageProvider,
  MessageResponse,
  NotificationResponse,
  ProviderContext,
  TelegramBot,
  UpdatesContextByType,
  UpdatesProvider,
  UserDataContextExtension,
  getUpdateContextUser,
} from '@tg-sensei/bot';

import prisma from 'db/prisma';

import { CommandType } from 'telegram-bot/types/commands';
import { CallbackData, callbackDataSchema } from 'telegram-bot/types/keyboard';

import { getUserDataProvider } from 'telegram-bot/utilities/providers';
import CustomError, { ErrorCode } from 'utilities/CustomError';
import { prepareErrorForHuman } from 'utilities/error';

if (!process.env.TELEGRAM_BOT_TOKEN) {
  console.error('No telegram bot token');

  process.exit(1);
}

export type UserData = Omit<TelegramUserData, 'telegramUserId'>;

const userUpdates = new UpdatesProvider();

export const commandsProvider = new CommandsProvider<
  CommandType,
  UpdatesContextByType<'message'> & UserDataContextExtension<UserData>
>();

export const callbackDataProvider = new JsonStorageCallbackDataProvider<
  CallbackData,
  UpdatesContextByType<'callback_query'> & UserDataContextExtension<UserData>
>({
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

export const messageUserDataProvider = getUserDataProvider<UpdatesContextByType<'message'>>();

const callbackQueryMessageProvider = new MessageProvider<UpdatesContextByType<'callback_query'>>();
const callbackQueryUserDataProvider = getUserDataProvider<ProviderContext<typeof callbackQueryMessageProvider>>();

const bot = new TelegramBot({
  token: process.env.TELEGRAM_BOT_TOKEN,
});

const allowedUsernames = process.env.USERNAME_WHITELIST?.split(',').filter(Boolean) ?? [];

commandsProvider.use(async ({ user, commands }, next) => {
  if (commands.length > 0) {
    await user.updateData({
      state: TelegramUserState.Waiting,
    });
  }

  await next();
});

callbackDataProvider.use(async (ctx, next) => {
  try {
    await next();

    if ('isRefresh' in ctx.callbackData && ctx.callbackData.isRefresh) {
      await ctx.respondWith(
        new NotificationResponse({
          text: 'Данные обновлены',
        }),
      );
    }
  } catch (err) {
    await ctx.respondWith(
      new NotificationResponse({
        text: prepareErrorForHuman(err),
      }),
    );

    return;
  }

  try {
    await ctx.respondWith(
      new NotificationResponse({
        text: '',
      }),
    );
  } catch {
    /* empty */
  }
});

messageUserDataProvider.use(commandsProvider);

userUpdates.handle('message', async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    await ctx.respondWith(
      new MessageResponse({
        content: prepareErrorForHuman(err),
      }),
    );
  }
});
userUpdates.handle('message', messageUserDataProvider);
userUpdates.handle(
  'callback_query',
  callbackQueryMessageProvider.use(callbackQueryUserDataProvider.use(callbackDataProvider)),
);

bot.use(async (ctx, next) => {
  const user = getUpdateContextUser(ctx);

  if (user && (!user.username || !allowedUsernames.includes(user.username))) {
    return;
  }

  await next();
});
bot.use(userUpdates);

export default bot;
