import { IApiResponseBody, Reply } from 'yandex-dialogs-sdk';

import VoicedText from 'alice-client/utilities/VoicedText';

export interface VoiceResponseOptions {
  text: string | VoicedText;
  endSession?: boolean;
}

export default class VoiceResponse {
  private readonly text: string | VoicedText;
  private readonly endSession?: boolean;

  constructor(options: VoiceResponseOptions) {
    this.text = options.text;
    this.endSession = options.endSession ?? true;
  }

  toApiResponse(): IApiResponseBody {
    return Reply.text(typeof this.text === 'string' ? this.text : this.text.toCompiled(), {
      end_session: this.endSession,
    });
  }
}
