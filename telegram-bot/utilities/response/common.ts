import TelegramResponseError from 'telegram-bot/utilities/TelegramResponseError';
import ImmediateTextResponse from 'telegram-bot/utilities/response/ImmediateTextResponse';
import { prepareErrorForHuman } from 'utilities/error';

export function getErrorResponse(err: unknown): ImmediateTextResponse {
  return new ImmediateTextResponse({
    text: prepareErrorForHuman(err),
    keyboard: err instanceof TelegramResponseError ? err.keyboard : undefined,
  });
}
