export enum ErrorCode {
  NO_AUTH = 'NO_AUTH',
  WRONG_FORMAT = 'WRONG_FORMAT',
  DOWNLOAD_ERROR = 'DOWNLOAD_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_ADDED = 'ALREADY_ADDED',
  SAME_CONTENT = 'SAME_CONTENT',
  UNSUPPORTED = 'UNSUPPORTED',
}

class CustomError extends Error {
  code: ErrorCode;
  humanMessage?: string;

  constructor(code: ErrorCode, humanMessage?: string, options?: ErrorOptions & { message?: string }) {
    super(options?.message ?? humanMessage ?? code, options);

    this.code = code;
    this.humanMessage = humanMessage;
  }
}

export default CustomError;
