import ImmediateTextResponse from 'telegram-bot/utilities/ImmediateTextResponse';
import { prepareErrorForHuman } from 'utilities/error';

export function getErrorResponse(err: unknown): ImmediateTextResponse {
  return new ImmediateTextResponse({
    text: prepareErrorForHuman(err),
  });
}
