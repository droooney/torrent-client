import { Alice, IApiResponse, Reply } from 'yandex-dialogs-sdk';
import { TextReplyDeclaration } from 'yandex-dialogs-sdk/dist/reply/textReplyBuilder';

import { IntentType } from 'alice-client/constants/intents';

import { AnyApiEntity } from 'yandex-dialogs-sdk/dist/api/nlu';
import { IApiRequest } from 'yandex-dialogs-sdk/dist/api/request';

import { MaybePromise } from 'types/common';

import CustomError, { ErrorCode } from 'utilities/CustomError';
import { prepareErrorForHuman } from 'utilities/error';

export interface CommandContext {
  slots: Partial<Record<string, AnyApiEntity>>;
}

export type CommandHandler = (ctx: CommandContext) => MaybePromise<TextReplyDeclaration>;

export default class AliceClient {
  private readonly alice = new Alice();

  private readonly intentHandlers: Partial<Record<IntentType, CommandHandler>> = {};

  constructor() {
    this.alice.command(/^.*$/, async (context) => {
      try {
        for (const intent in this.intentHandlers) {
          if (!(intent in this.intentHandlers)) {
            continue;
          }

          const handler = this.intentHandlers[intent as IntentType];

          if (!handler) {
            continue;
          }

          const slots = context.nlu?.intents?.[intent]?.slots;

          if (!slots) {
            continue;
          }

          const ctx: CommandContext = {
            slots,
          };

          return Reply.text(await handler(ctx));
        }

        throw new CustomError(ErrorCode.UNSUPPORTED, 'Команда не распознана');
      } catch (err) {
        return Reply.text(prepareErrorForHuman(err));
      }
    });
  }

  getUnhandledIntents(): IntentType[] {
    return Object.values(IntentType).filter((intent) => !(intent in this.intentHandlers));
  }

  handleIntent(intentType: IntentType, handler: CommandHandler): void {
    this.intentHandlers[intentType] = handler;
  }

  async handleRequest(request: IApiRequest): Promise<IApiResponse> {
    return this.alice.handleRequest(request);
  }
}
