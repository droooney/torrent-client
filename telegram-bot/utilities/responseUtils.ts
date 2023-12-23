import Response from 'telegram-bot/utilities/Response';
import CustomError from 'utilities/CustomError';

export function getErrorResponse(err: unknown): Response {
  return new Response({
    text: err instanceof CustomError ? err.message : 'Произошла ошибка',
  });
}
