export type OpendatabotErrorCode =
  | "INVALID_REQUEST"
  | "AUTHENTICATION_ERROR"
  | "ACCESS_DENIED"
  | "NOT_FOUND"
  | "TIMEOUT"
  | "CONFLICT"
  | "VALIDATION_ERROR"
  | "RATE_LIMITED"
  | "PROVIDER_ERROR"
  | "PROVIDER_BAD_GATEWAY"
  | "PROVIDER_UNAVAILABLE"
  | "PROVIDER_TIMEOUT"
  | "UNKNOWN_ERROR";

export class OpendatabotError extends Error {
  constructor(
    public readonly code: OpendatabotErrorCode,
    message: string,
    public readonly status?: number,
    public readonly originalResponse?: any
  ) {
    super(message);
    this.name = "OpendatabotError";
    Object.setPrototypeOf(this, OpendatabotError.prototype);
  }

  public static fromHttpStatus(status: number, message: string, rawResponse?: any): OpendatabotError {
    let code: OpendatabotErrorCode = "UNKNOWN_ERROR";

    switch (status) {
      case 400:
        code = "INVALID_REQUEST";
        break;
      case 401:
        code = "AUTHENTICATION_ERROR";
        break;
      case 403:
        code = "ACCESS_DENIED";
        break;
      case 404:
        code = "NOT_FOUND";
        break;
      case 408:
        code = "TIMEOUT";
        break;
      case 409:
        code = "CONFLICT";
        break;
      case 422:
        code = "VALIDATION_ERROR";
        break;
      case 429:
        code = "RATE_LIMITED";
        break;
      case 500:
        code = "PROVIDER_ERROR";
        break;
      case 502:
        code = "PROVIDER_BAD_GATEWAY";
        break;
      case 503:
        code = "PROVIDER_UNAVAILABLE";
        break;
      case 504:
        code = "PROVIDER_TIMEOUT";
        break;
      default:
        code = "UNKNOWN_ERROR";
    }

    return new OpendatabotError(code, message, status, rawResponse);
  }
}
