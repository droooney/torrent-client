import { MaybePromise } from 'types/common';

import CustomError, { ErrorCode } from 'utilities/CustomError';

export async function delay(ms: number): Promise<void> {
  await new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export type TimedOptions<Result> = {
  time: number;
  task: (signal: AbortSignal) => MaybePromise<Result>;
  errorMessage?: string;
};

export async function timed<Result>(options: TimedOptions<Result>): Promise<Result> {
  const { time, task, errorMessage = 'Операция выполнялась слишком долго' } = options;

  const abortController = new AbortController();

  return Promise.race([
    (async () => task(abortController.signal))(),
    (async () => {
      await delay(time);

      const error = new CustomError(ErrorCode.TIMEOUT, errorMessage);

      abortController.abort(error);

      throw error;
    })(),
  ]);
}
