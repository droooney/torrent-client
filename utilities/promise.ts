import { MaybePromise } from 'types/common';

import CustomError, { ErrorCode } from 'utilities/CustomError';

export async function delay(ms: number): Promise<void> {
  await new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export type TimedOptions<Result, ThrowOnTimeout extends boolean> = {
  time: number;
  task: (signal: AbortSignal) => MaybePromise<Result>;
  errorMessage?: string;
} & (ThrowOnTimeout extends true
  ? { throwOnTimeout?: ThrowOnTimeout }
  : {
      throwOnTimeout: ThrowOnTimeout;
    });

export async function timed<Result, ThrowOnTimeout extends boolean = true>(
  options: TimedOptions<Result, ThrowOnTimeout>,
): Promise<ThrowOnTimeout extends true ? Result : Result | null> {
  const { time, task, errorMessage = 'Операция выполнялась слишком долго', throwOnTimeout = true } = options;

  const abortController = new AbortController();

  return (await Promise.race([
    (async () => task(abortController.signal))(),
    (async () => {
      await delay(time);

      const error = new CustomError(ErrorCode.TIMEOUT, errorMessage);

      abortController.abort(error);

      if (throwOnTimeout) {
        throw error;
      }

      return null;
    })(),
  ])) as ThrowOnTimeout extends true ? Result : Result | null;
}
