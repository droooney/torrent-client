import CustomError from 'utilities/CustomError';

export function prepareErrorForLogging(err: unknown): string {
  return err instanceof Error
    ? `${err.stack ?? err.message}${
        err instanceof AggregateError
          ? `
    [Aggregated from]: ${
      err.errors
        .map(
          (err) => `
        ${prepareErrorForLogging(err).replace(/\n/g, '\n        ')}`,
        )
        .join('') || '<empty>'
    }
    `
          : ''
      }${
        err.cause
          ? `
    [Caused by]: ${prepareErrorForLogging(err.cause).replace(/\n/g, '\n    ')}`
          : ''
      }`
    : String(err);
}

export function prepareErrorForHuman(err: unknown): string {
  return (err instanceof CustomError ? err.humanMessage : undefined) ?? 'Произошла ошибка';
}
