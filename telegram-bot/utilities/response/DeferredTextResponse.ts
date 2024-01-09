import { Message } from 'node-telegram-bot-api';

import Markdown from 'telegram-bot/utilities/Markdown';
import ImmediateTextResponse from 'telegram-bot/utilities/response/ImmediateTextResponse';
import TextResponse, { EditMessageContext, SendMessageContext } from 'telegram-bot/utilities/response/TextResponse';
import { getErrorResponse } from 'telegram-bot/utilities/response/common';
import { prepareErrorForLogging } from 'utilities/error';
import { formatProgress } from 'utilities/number';
import { delay } from 'utilities/promise';

import bot from 'telegram-bot/bot';

export interface DeferredTextResponseOptions {
  immediate: ImmediateTextResponse;
  getDeferred(): Promise<TextResponse>;
  minimalDelay?: number;
}

interface Updater {
  start(message: Message): void;
  cancel(): void;
  getCurrentResponse(): ImmediateTextResponse;
  waitForLatestUpdate(): Promise<void>;
}

const MINIMAL_DELAY = 1000;
const UPDATE_INTERVAL = 2000;
const PROGRESS_EMOJI_COUNT = 3;

class DeferredTextResponse extends TextResponse {
  private readonly immediate: ImmediateTextResponse;
  private readonly getDeferred: () => Promise<TextResponse>;
  private readonly minimalDelay: number;

  constructor(options: DeferredTextResponseOptions) {
    super();

    this.immediate = options.immediate;
    this.getDeferred = options.getDeferred;
    this.minimalDelay = options.minimalDelay ?? MINIMAL_DELAY;
  }

  async editMessage(ctx: EditMessageContext): Promise<Message> {
    const { start: startUpdating, cancel: cancelUpdating, getCurrentResponse, waitForLatestUpdate } = this.getUpdater();
    let message = ctx.message;

    try {
      message = await getCurrentResponse().editMessage(ctx);
    } catch (err) {
      console.log(prepareErrorForLogging(err));
    }

    startUpdating(ctx.message);

    try {
      const [deferredResponse] = await Promise.all([
        this.getDeferred(),
        this.minimalDelay > 0 && delay(this.minimalDelay),
      ]);

      cancelUpdating();

      await waitForLatestUpdate();

      message = await (deferredResponse ?? this.immediate).editMessage(ctx);
    } catch (err) {
      console.log(prepareErrorForLogging(err));

      cancelUpdating();

      try {
        message = await getErrorResponse(err).editMessage(ctx);
      } catch (err) {
        console.log(prepareErrorForLogging(err));
      }
    }

    return message;
  }

  private getUpdater(): Updater {
    let counter = 0;
    let currentUpdatePromise = Promise.resolve();
    let timeoutCanceled = false;
    let messageToUpdate: Message | undefined;

    const getLoadingResponse = (): ImmediateTextResponse => {
      const { text, keyboard } = this.immediate;

      return new ImmediateTextResponse({
        text: Markdown.create`${text}

${formatProgress(((counter % 3) + 1) / PROGRESS_EMOJI_COUNT, {
  emojiCount: PROGRESS_EMOJI_COUNT,
  shape: 'circle',
})}`,
        keyboard,
      });
    };

    const updateLoading = async () => {
      if (!messageToUpdate) {
        return;
      }

      const timestamp = Date.now();

      counter++;

      await (currentUpdatePromise = (async () => {
        try {
          await bot.editMessage(messageToUpdate, getLoadingResponse());
        } catch {
          // empty
        }
      })());

      if (timeoutCanceled) {
        return;
      }

      timeout = setTimeout(updateLoading, Math.max(0, UPDATE_INTERVAL - (Date.now() - timestamp)));
    };

    let timeout: NodeJS.Timeout | undefined;

    return {
      start(message) {
        messageToUpdate = message;
        timeout = setTimeout(updateLoading, UPDATE_INTERVAL);
      },
      cancel() {
        timeoutCanceled = true;

        clearTimeout(timeout);
      },
      getCurrentResponse: getLoadingResponse,
      async waitForLatestUpdate() {
        await currentUpdatePromise;
      },
    };
  }

  async sendMessage(ctx: SendMessageContext): Promise<Message> {
    const { start: startUpdating, cancel: cancelUpdating, getCurrentResponse, waitForLatestUpdate } = this.getUpdater();

    let message: Message;

    try {
      message = await getCurrentResponse().sendMessage(ctx);
    } catch (err) {
      console.log(prepareErrorForLogging(err));

      return (await this.getDeferred()).sendMessage(ctx);
    }

    startUpdating(message);

    try {
      const [deferredResponse] = await Promise.all([
        this.getDeferred(),
        this.minimalDelay > 0 && delay(this.minimalDelay),
      ]);

      cancelUpdating();

      await waitForLatestUpdate();

      message = await bot.editMessage(message, deferredResponse ?? this.immediate);
    } catch (err) {
      console.log(prepareErrorForLogging(err));

      cancelUpdating();

      await waitForLatestUpdate();

      try {
        message = await bot.editMessage(message, getErrorResponse(err));
      } catch (err) {
        console.log(prepareErrorForLogging(err));
      }
    }

    return message;
  }
}

export default DeferredTextResponse;
