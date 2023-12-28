import Response from 'telegram-bot/utilities/Response';
import { prepareErrorForHuman } from 'utilities/error';

export function getErrorResponse(err: unknown): Response {
  return new Response({
    text: prepareErrorForHuman(err),
  });
}
