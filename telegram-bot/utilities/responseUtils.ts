import Response from 'telegram-bot/utilities/Response';
import TextResponse from 'telegram-bot/utilities/TextResponse';
import { prepareErrorForHuman } from 'utilities/error';

export function getErrorResponse(err: unknown): Response {
  return new TextResponse({
    text: prepareErrorForHuman(err),
  });
}
