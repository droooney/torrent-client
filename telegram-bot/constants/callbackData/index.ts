import { rootBeautifyCallbackDataMapper, rootUglifyCallbackDataMapper } from 'telegram-bot/constants/callbackData/root';
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
  ...torrentClientUglifyCallbackDataMapper,
};

export const beautifyCallbackDataMapper: BeautifyCallbackDataMapper<CallbackButtonSource> = {
  ...rootBeautifyCallbackDataMapper,
  ...torrentClientBeautifyCallbackDataMapper,
};
