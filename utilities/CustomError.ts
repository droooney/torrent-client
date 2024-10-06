export enum ErrorCode {
  NO_AUTH = 'NO_AUTH',
  WRONG_FORMAT = 'WRONG_FORMAT',
  DOWNLOAD_ERROR = 'DOWNLOAD_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_ADDED = 'ALREADY_ADDED',
  UNSUPPORTED = 'UNSUPPORTED',
  EXPIRED = 'EXPIRED',
  NOT_FINISHED = 'NOT_FINISHED',
  COMMAND_ERROR = 'COMMAND_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',
}

export interface CustomErrorOptions extends ErrorOptions {
  message?: string;
}

class CustomError extends Error {
  code: ErrorCode;
  humanMessage?: string;

  constructor(code: ErrorCode, humanMessage?: string, options?: CustomErrorOptions) {
    super(options?.message ?? humanMessage ?? code, options);

    this.code = code;
    this.humanMessage = humanMessage;
  }
}

export default CustomError;
