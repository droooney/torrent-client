import aliceClient from 'alice-client/client';
import { yellow } from 'colors/safe';

import './commands';

const unhandledCommands = aliceClient.getUnhandledCommands();

if (unhandledCommands.length > 0) {
  console.log(yellow(`Необработанные команды: ${unhandledCommands.join(', ')}`));
}
