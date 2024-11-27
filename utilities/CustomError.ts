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
  NO_MAC = 'NO_MAC',
  NO_ADDRESS = 'NO_ADDRESS',
  NOT_ACTIVE = 'NOT_ACTIVE',
  CONDITIONS_NOT_MET = 'CONDITIONS_NOT_MET',
  WIFI_NETWORK_NOT_SET = 'WIFI_NETWORK_NOT_SET',
  WRONG_MATTER_PAIRING_CODE = 'WRONG_MATTER_PAIRING_CODE',
  UNAUTHORIZED = 'UNAUTHORIZED',
  KEENETIC_ERROR = 'KEENETIC_ERROR',
}

export interface CustomErrorOptions extends ErrorOptions {
  message?: string;
  details?: unknown;
}

class CustomError extends Error {
  code: ErrorCode;
  humanMessage?: string;
  details?: unknown;

  constructor(code: ErrorCode, humanMessage?: string, options?: CustomErrorOptions) {
    super(options?.message ?? humanMessage ?? code, options);

    this.code = code;
    this.humanMessage = humanMessage;
    this.details = options?.details;
  }
}

export default CustomError;
