import 'utilities/importEnv';

import 'alice-client';
import 'telegram-bot';
import 'web-server';

import { prepareErrorForLogging } from 'utilities/error';

process.on('uncaughtException', (err) => {
  console.log(prepareErrorForLogging(err));

  process.exit(1);
});
