import aliceClient from 'alice-client/client';
import { yellow } from 'colors/safe';

import './intents';

const unhandledIntents = aliceClient.getUnhandledIntents();

if (unhandledIntents.length > 0) {
  console.log(yellow(`Необработанные интенты: ${unhandledIntents.join(', ')}`));
}
