import CustomError from 'utilities/CustomError';

export function prepareErrorForLogging(err: unknown): unknown {
  return err instanceof Error ? err.stack : err;
}

export function prepareErrorForHuman(err: unknown): string {
  return (err instanceof CustomError ? err.humanMessage : undefined) ?? 'Произошла ошибка';
}
