import { Prisma, TelegramUserData, TelegramUserState } from '@prisma/client';
import TelegramBotApi, { Message, User } from 'node-telegram-bot-api';

import { DOWNLOADS_DIRECTORY } from 'constants/paths';
import commands, { CommandType } from 'telegram-bot/constants/commands';

import prisma from 'db/prisma';

import {
  BeautifiedCallbackData,
  BeautifiedCallbackDataBySource,
  CallbackButtonSource,
  callbackDataSchema,
} from 'telegram-bot/types/keyboard';

import DeferredResponse from 'telegram-bot/utilities/DeferredResponse';
import Response from 'telegram-bot/utilities/Response';
import { beautifyCallbackData } from 'telegram-bot/utilities/keyboard';
import { getErrorResponse } from 'telegram-bot/utilities/responseUtils';
import CustomError, { ErrorCode } from 'utilities/CustomError';
import { prepareErrorForHuman, prepareErrorForLogging } from 'utilities/error';

export interface BotOptions {
  token: string;
  usernameWhitelist: string[];
}

export interface TextHandlerContext {
  message: Message;
  userData: TelegramUserData;
  send(response: AnyResponse): Promise<typeof response extends Response ? Message : Message | null>;
  downloadDocument(): Promise<string | null>;
  updateUserState(
    data: Prisma.XOR<Prisma.TelegramUserDataUpdateInput, Prisma.TelegramUserDataUncheckedUpdateInput>,
  ): Promise<TelegramUserData>;
}

export interface CallbackQueryHandlerContext<CallbackData extends BeautifiedCallbackData> {
  data: CallbackData;
  message: Message;
  edit(response: AnyResponse): Promise<void>;
  updateUserState(
    data: Prisma.XOR<Prisma.TelegramUserDataUpdateInput, Prisma.TelegramUserDataUncheckedUpdateInput>,
  ): Promise<TelegramUserData>;
}

export interface ResponseSendContext {
  message: Message;
  api: TelegramBotApi;
}

export interface ResponseEditContext {
  message: Message;
  api: TelegramBotApi;
}

export type AnyResponse = Response | DeferredResponse;

export type TextHandler = (ctx: TextHandlerContext) => Promise<AnyResponse | null | undefined | void>;

export type CallbackQueryHandler<CallbackData extends BeautifiedCallbackData> = (
  ctx: CallbackQueryHandlerContext<CallbackData>,
) => Promise<AnyResponse | null | undefined | void>;

class Bot {
  private readonly api: TelegramBotApi;
  private readonly usernameWhitelist: (string | undefined)[];
  private readonly commandHandlers: Partial<Record<CommandType, TextHandler>> = {};
  private readonly userStateHandlers: Partial<Record<TelegramUserState, TextHandler>> = {};
  private readonly callbackDataHandlers: {
    [Source in CallbackButtonSource]?: CallbackQueryHandler<BeautifiedCallbackDataBySource<Source>>;
  } = {};

  constructor(options: BotOptions) {
    this.api = new TelegramBotApi(options.token, {
      polling: {
        autoStart: false,
      },
    });
    this.usernameWhitelist = options.usernameWhitelist;
  }

  handleCallbackQuery<Source extends CallbackButtonSource>(
    source: Source | Source[],
    handler: CallbackQueryHandler<BeautifiedCallbackDataBySource<Source>>,
  ): void {
    ([] as Source[]).concat(source).forEach((source) => {
      // @ts-ignore
      this.callbackDataHandlers[source] = handler;
    });
  }

  async editMessage(message: Message, response: AnyResponse): Promise<void> {
    await response.edit({
      message,
      api: this.api,
    });
  }

  handleCommand(command: CommandType, handler: TextHandler): void {
    this.commandHandlers[command] = handler;
  }

  handleUserState(state: TelegramUserState, handler: TextHandler): void {
    this.userStateHandlers[state] = handler;
  }

  isUserAllowed(user: User): boolean {
    return this.usernameWhitelist.includes(user.username);
  }

  async replyToMessage(
    message: Message,
    response: AnyResponse,
  ): Promise<typeof response extends Response ? Message : Message | null> {
    return response.send({
      message,
      api: this.api,
    });
  }

  async start(): Promise<void> {
    this.api.on('message', async (message) => {
      try {
        const { from: user, text, document } = message;

        if (!user || !this.isUserAllowed(user)) {
          return;
        }

        const userId = user.id;

        const userData = await prisma.telegramUserData.upsert({
          where: {
            userId,
          },
          update: {},
          create: {
            userId,
            state: 'First',
          },
        });

        const ctx: TextHandlerContext = {
          message,
          userData,
          send: async (response) => {
            return this.replyToMessage(message, response);
          },
          downloadDocument: async () => {
            if (!document) {
              return null;
            }

            return this.api.downloadFile(document.file_id, DOWNLOADS_DIRECTORY);
          },
          updateUserState: async (data) => {
            return prisma.telegramUserData.update({
              where: {
                userId,
              },
              data,
            });
          },
        };

        let handler: TextHandler | undefined;

        if (text && text in this.commandHandlers) {
          handler = this.commandHandlers[text as CommandType];
        }

        if (!handler) {
          handler = this.userStateHandlers[userData.state];
        }

        if (!handler) {
          return;
        }

        const response = await handler(ctx);

        if (response) {
          await ctx.send(response);
        }
      } catch (err) {
        console.log(prepareErrorForLogging(err));

        try {
          await this.replyToMessage(message, getErrorResponse(err));
        } catch (err) {
          console.log(prepareErrorForLogging(err));
        }
      }
    });

    this.api.on('callback_query', async (query) => {
      const { id: queryId, from: user, message, data } = query;

      if (!user || !message || !this.isUserAllowed(user)) {
        return;
      }

      const userId = user.id;

      try {
        if (!data) {
          return;
        }

        const callbackData = JSON.parse(data);

        const userData = await prisma.telegramUserData.findUnique({
          where: {
            userId,
          },
        });

        if (!userData) {
          return;
        }

        const parsed = callbackDataSchema.safeParse(callbackData);

        if (!parsed.success) {
          throw new CustomError(ErrorCode.UNSUPPORTED, 'Не поддерживается', {
            cause: parsed.error,
          });
        }

        const beautifiedCallbackData = beautifyCallbackData(parsed.data);

        const ctx: CallbackQueryHandlerContext<typeof beautifiedCallbackData> = {
          data: beautifiedCallbackData,
          message,
          edit: async (response) => {
            await this.editMessage(message, response);
          },
          updateUserState: async (data) => {
            return prisma.telegramUserData.update({
              where: {
                userId,
              },
              data,
            });
          },
        };

        const handler = this.callbackDataHandlers[beautifiedCallbackData.source] as
          | CallbackQueryHandler<typeof beautifiedCallbackData>
          | undefined;

        if (!handler) {
          throw new CustomError(ErrorCode.UNSUPPORTED, 'Не поддерживается');
        }

        const response = await handler(ctx);

        if (response) {
          await ctx.edit(response);
        }
      } catch (err) {
        let isSameContent = false;

        if (err instanceof CustomError && err.code === ErrorCode.SAME_CONTENT) {
          isSameContent = true;
        } else {
          console.log(prepareErrorForLogging(err));
        }

        try {
          await this.api.answerCallbackQuery(queryId, {
            text: isSameContent ? '' : prepareErrorForHuman(err),
          });
        } catch (err) {
          console.log(prepareErrorForLogging(err));
        }
      }
    });

    await this.api.setMyCommands(commands);

    await this.api.startPolling();
  }
}

export default Bot;
