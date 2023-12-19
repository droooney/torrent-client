import { Message } from 'node-telegram-bot-api';

import { ResponseSendContext } from 'telegram-bot/utilities/Bot';
import Markdown from 'telegram-bot/utilities/Markdown';
import Response from 'telegram-bot/utilities/Response';
import { getErrorResponse } from 'telegram-bot/utilities/responseUtils';
import { formatProgress } from 'utilities/number';
import { delay } from 'utilities/promise';

import bot from 'telegram-bot/bot';

export interface DeferredResponseOptions {
  immediate: Response;
  deferred: Promise<Response | null | undefined | void>;
  minimalDelay?: number;
}

const MINIMAL_DELAY = 1000;
const UPDATE_INTERVAL = 1000;
const PROGRESS_EMOJI_COUNT = 3;

class DeferredResponse {
  private readonly immediate: Response;
  private readonly deferred: Promise<Response | null | undefined | void>;
  private readonly minimalDelay: number;

  constructor(options: DeferredResponseOptions) {
    this.immediate = options.immediate;
    this.deferred = options.deferred;
    this.minimalDelay = options.minimalDelay ?? MINIMAL_DELAY;

    options.deferred.catch(() => {});
  }

  async send(ctx: ResponseSendContext): Promise<Message | null> {
    let counter = 0;
    let currentUpdatePromise = Promise.resolve();
    let timeoutCanceled = false;

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

    const cancelTimeout = () => {
      timeoutCanceled = true;

      clearTimeout(timeout);
    };

    let message: Message;

    try {
      message = await getLoadingResponse().send(ctx);
    } catch (err) {
      console.log(err instanceof Error ? err.stack : err);

      return (await this.deferred)?.send(ctx) ?? null;
    }

    const updateLoading = async () => {
      const timestamp = Date.now();

      counter++;

      await (currentUpdatePromise = (async () => {
        try {
          await bot.editMessage(message, getLoadingResponse());
        } catch {
          // empty
        }
      })());

      if (timeoutCanceled) {
        return;
      }

      timeout = setTimeout(updateLoading, Math.max(0, UPDATE_INTERVAL - (Date.now() - timestamp)));
    };

    let timeout = setTimeout(updateLoading, UPDATE_INTERVAL);

    try {
      const [deferredResponse] = await Promise.all([this.deferred, this.minimalDelay > 0 && delay(this.minimalDelay)]);

      cancelTimeout();

      await currentUpdatePromise;

      if (deferredResponse) {
        await bot.editMessage(message, deferredResponse);
      }
    } catch (err) {
      console.log(err instanceof Error ? err.stack : err);

      cancelTimeout();

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
