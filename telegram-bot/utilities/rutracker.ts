import { TextHandlerContext } from 'telegram-bot/utilities/Bot';
import Markdown from 'telegram-bot/utilities/Markdown';
import Response from 'telegram-bot/utilities/Response';
import { getErrorResponse, getSearchRutrackerResponse } from 'telegram-bot/utilities/responseUtils';
import { formatProgress } from 'utilities/number';

import bot from 'telegram-bot/bot';

const UPDATE_INTERVAL = 1000;
const PROGRESS_EMOJI_COUNT = 3;

export async function searchRutracker(ctx: TextHandlerContext): Promise<void> {
  const text = ctx.message.text ?? '';

  let counter = 0;
  let currentUpdatePromise = Promise.resolve();

  const getLoadingResponse = (): Response => {
    return new Response({
      text: Markdown.create`Запущен поиск на rutracker по строке "${text}"...

${formatProgress(((counter % 3) + 1) / PROGRESS_EMOJI_COUNT, {
  emojiCount: PROGRESS_EMOJI_COUNT,
  shape: 'circle',
})}`,
    });
  };

  const message = await ctx.send(getLoadingResponse());

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

    timeout = setTimeout(updateLoading, Math.max(0, UPDATE_INTERVAL - (Date.now() - timestamp)));
  };

  let timeout = setTimeout(updateLoading, UPDATE_INTERVAL);

  try {
    const rutrackerResponse = await getSearchRutrackerResponse(text);

    clearTimeout(timeout);

    await currentUpdatePromise;

    await bot.editMessage(message, rutrackerResponse);
  } catch (err) {
    console.log(err instanceof Error ? err.stack : err);

    clearTimeout(timeout);

    await bot.editMessage(message, getErrorResponse(err));
  }
}
