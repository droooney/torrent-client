import cp from 'node:child_process';

import CustomError, { ErrorCode } from 'utilities/CustomError';
import { prepareErrorForLogging } from 'utilities/error';

export function runMain(main: () => unknown): void {
  (async () => {
    await main();
  })().catch((err) => {
    console.log(prepareErrorForLogging(err));

    process.exit(1);
  });
}

export async function exec(command: string): Promise<string> {
  return new Promise((resolve, reject) => {
    cp.exec(command, (error, stdout, stderr) => {
      if (error || stderr) {
        return reject(
          new CustomError(
            ErrorCode.COMMAND_ERROR,
            'Ошибка выполнения команды',
            error
              ? {
                  cause: error,
                }
              : {
                  message: `Ошибка выполнения команды ${JSON.stringify(command)}: ${stderr}`,
                },
          ),
        );
      }

      resolve(stdout);
    });
  });
}
