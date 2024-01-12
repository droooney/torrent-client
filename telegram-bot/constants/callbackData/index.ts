import {
  devicesClientBeautifyCallbackDataMapper,
  devicesClientUglifyCallbackDataMapper,
} from 'telegram-bot/constants/callbackData/devices-client';
import { rootBeautifyCallbackDataMapper, rootUglifyCallbackDataMapper } from 'telegram-bot/constants/callbackData/root';
import {
  systemBeautifyCallbackDataMapper,
  systemUglifyCallbackDataMapper,
} from 'telegram-bot/constants/callbackData/system';
import {
  torrentClientBeautifyCallbackDataMapper,
  torrentClientUglifyCallbackDataMapper,
} from 'telegram-bot/constants/callbackData/torrent-client';

import {
  BeautifyCallbackDataMapper,
  CallbackButtonSource,
  UglifyCallbackDataMapper,
} from 'telegram-bot/types/keyboard';

export const uglifyCallbackDataMapper: UglifyCallbackDataMapper<CallbackButtonSource> = {
  ...rootUglifyCallbackDataMapper,
  ...systemUglifyCallbackDataMapper,
  ...devicesClientUglifyCallbackDataMapper,
  ...torrentClientUglifyCallbackDataMapper,
};

export const beautifyCallbackDataMapper: BeautifyCallbackDataMapper<CallbackButtonSource> = {
  ...rootBeautifyCallbackDataMapper,
  ...systemBeautifyCallbackDataMapper,
  ...devicesClientBeautifyCallbackDataMapper,
  ...torrentClientBeautifyCallbackDataMapper,
};
