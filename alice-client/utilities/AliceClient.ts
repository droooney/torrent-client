import omit from 'lodash/omit';
import { Alice, IApiResponse, Reply } from 'yandex-dialogs-sdk';

import { CommandType } from 'alice-client/constants/commands';

import { AnyApiEntity } from 'yandex-dialogs-sdk/dist/api/nlu';
import { IApiRequest } from 'yandex-dialogs-sdk/dist/api/request';

import { MaybePromise } from 'types/common';

import CustomError, { ErrorCode } from 'utilities/CustomError';
import { prepareErrorForHuman } from 'utilities/error';

export interface CommandContext {
  slots: Partial<Record<string, AnyApiEntity>>;
}

export type CommandHandler = (ctx: CommandContext) => MaybePromise<string>;

export default class AliceClient {
  private readonly alice = new Alice();

  private readonly commandHandlers: Partial<Record<CommandType, CommandHandler>> = {};

  constructor() {
    this.alice.command(/^.*$/, async (context) => {
      try {
        for (const command in this.commandHandlers) {
          if (!(command in this.commandHandlers)) {
            continue;
          }

          const handler = this.commandHandlers[command as CommandType];

          if (!handler) {
            continue;
          }

          const [namespace, action] = command.split('.');

          const slots = context.nlu?.intents?.[namespace]?.slots;

          if (!slots?.[action]) {
            continue;
          }

          const ctx: CommandContext = {
            slots: omit(slots, action),
          };

          return Reply.text(await handler(ctx));
        }

        throw new CustomError(ErrorCode.UNSUPPORTED, 'Команда не распознана');
      } catch (err) {
        return Reply.text(prepareErrorForHuman(err));
      }
    });
  }

  getUnhandledCommands(): CommandType[] {
    return Object.values(CommandType).filter((command) => !(command in this.commandHandlers));
  }

  handleCommand(command: CommandType, handler: CommandHandler): void {
    this.commandHandlers[command] = handler;
  }

  async handleRequest(request: IApiRequest): Promise<IApiResponse> {
    return this.alice.handleRequest(request);
  }
}
