import { MaybePromise } from 'types/common';

export async function delay(ms: number): Promise<void> {
  await new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export type TimeoutInfo = {
  timedOut: boolean;
};

export async function timed<Result extends Exclude<unknown, null | undefined>>(
  ms: number,
  task: (timeoutInfo: TimeoutInfo) => MaybePromise<Result>,
): Promise<Result | null> {
  const timeoutInfo: TimeoutInfo = {
    timedOut: false,
  };
  const result = await Promise.race([
    (async () => task(timeoutInfo))(),
    (async () => {
      await delay(ms);

      timeoutInfo.timedOut = true;
    })(),
  ]);

  return result ?? null;
}
