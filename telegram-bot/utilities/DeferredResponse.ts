import { Message } from 'node-telegram-bot-api';

import { AnyResponse, ResponseEditContext, ResponseSendContext } from 'telegram-bot/utilities/Bot';
import Markdown from 'telegram-bot/utilities/Markdown';
import Response from 'telegram-bot/utilities/Response';
import { getErrorResponse } from 'telegram-bot/utilities/responseUtils';
import { formatProgress } from 'utilities/number';
import { delay } from 'utilities/promise';

import bot from 'telegram-bot/bot';

export interface DeferredResponseOptions {
  immediate: Response;
  getDeferred(): Promise<AnyResponse | null | undefined | void>;
  minimalDelay?: number;
}

interface Updater {
  start(message: Message): void;
  cancel(): void;
  getCurrentResponse(): Response;
  waitForLatestUpdate(): Promise<void>;
}

const MINIMAL_DELAY = 1000;
const UPDATE_INTERVAL = 1000;
const PROGRESS_EMOJI_COUNT = 3;

class DeferredResponse {
  private readonly immediate: Response;
  private readonly getDeferred: () => Promise<AnyResponse | null | undefined | void>;
  private readonly minimalDelay: number;

  constructor(options: DeferredResponseOptions) {
    this.immediate = options.immediate;
    this.getDeferred = options.getDeferred;
    this.minimalDelay = options.minimalDelay ?? MINIMAL_DELAY;
  }

  async edit(ctx: ResponseEditContext): Promise<void> {
    const { start: startUpdating, cancel: cancelUpdating, getCurrentResponse, waitForLatestUpdate } = this.getUpdater();

    try {
      await getCurrentResponse().edit(ctx);
    } catch (err) {
      console.log(err instanceof Error ? err.stack : err);
    }

    startUpdating(ctx.message);

    try {
      const [deferredResponse] = await Promise.all([
        this.getDeferred(),
        this.minimalDelay > 0 && delay(this.minimalDelay),
      ]);

      cancelUpdating();

      await waitForLatestUpdate();

      await (deferredResponse ?? this.immediate).edit(ctx);
    } catch (err) {
      console.log(err instanceof Error ? err.stack : err);

      cancelUpdating();

      try {
        await getErrorResponse(err).edit(ctx);
      } catch (e) {
        console.log(e instanceof Error ? e.stack : e);
      }
    }
  }

  private getUpdater(): Updater {
    let counter = 0;
    let currentUpdatePromise = Promise.resolve();
    let timeoutCanceled = false;
    let messageToUpdate: Message | undefined;

    const getLoadingResponse = (): Response => {
      const { text, keyboard } = this.immediate;

      return new Response({
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

  async send(ctx: ResponseSendContext): Promise<Message | null> {
    const { start: startUpdating, cancel: cancelUpdating, getCurrentResponse, waitForLatestUpdate } = this.getUpdater();

    let message: Message;

    try {
      message = await getCurrentResponse().send(ctx);
    } catch (err) {
      console.log(err instanceof Error ? err.stack : err);

      return (await this.getDeferred())?.send(ctx) ?? null;
    }

    startUpdating(message);

    try {
      const [deferredResponse] = await Promise.all([
        this.getDeferred(),
        this.minimalDelay > 0 && delay(this.minimalDelay),
      ]);

      cancelUpdating();

      await waitForLatestUpdate();

      await bot.editMessage(message, deferredResponse ?? this.immediate);
    } catch (err) {
      console.log(err instanceof Error ? err.stack : err);

      cancelUpdating();

      try {
        await bot.editMessage(message, getErrorResponse(err));
      } catch (e) {
        console.log(e instanceof Error ? e.stack : e);
      }
    }

    return message;
  }
}

export default DeferredResponse;
