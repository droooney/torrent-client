import { MaybePromise } from 'types/common';

export async function delay(ms: number): Promise<void> {
  await new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function timed<Result extends Exclude<unknown, null | undefined>>(
  ms: number,
  task: () => MaybePromise<Result>,
): Promise<Result | null> {
  const result = await Promise.race([(async () => task())(), delay(ms)]);

  return result ?? null;
}
