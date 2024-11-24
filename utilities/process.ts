import cp, { ExecOptions } from 'node:child_process';

import { MaybePromise } from 'types/common';

import CustomError, { ErrorCode } from 'utilities/CustomError';
import { prepareErrorForLogging } from 'utilities/error';
import { delay } from 'utilities/promise';

export function runMain(main: () => unknown): void {
  (async () => {
    await main();
  })().catch((err) => {
    console.log(prepareErrorForLogging(err));

    process.exit(1);
  });
}

export function runTask(task: () => unknown): void {
  (async () => {
    await task();
  })().catch((err) => {
    console.log(prepareErrorForLogging(err));
  });
}

export async function exec(command: string, options?: ExecOptions): Promise<string> {
  return new Promise((resolve, reject) => {
    cp.exec(
      command,
      {
        cwd: process.cwd(),
        ...options,
      },
      (error, stdout, stderr) => {
        if (!error) {
          return resolve(stdout);
        }

        reject(
          new CustomError(ErrorCode.COMMAND_ERROR, 'Ошибка выполнения команды', {
            cause: error,
            message: `Ошибка выполнения команды ${JSON.stringify(command)}: ${stderr}`,
          }),
        );
      },
    );
  });
}

export async function poll(ms: number, check: () => MaybePromise<boolean>): Promise<void> {
  while (!(await check())) {
    await delay(ms);
  }
}
