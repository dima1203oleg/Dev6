/**
 * DPS Error Taxonomy
 * 
 * Unified error classification for DPS connector pack
 * 
 * Error Types:
 * - AUTH_ERROR
 * - RATE_LIMITED
 * - TIMEOUT
 * - NETWORK_ERROR
 * - UPSTREAM_5XX
 * - UPSTREAM_MAINTENANCE
 * - INVALID_REQUEST
 * - SCHEMA_ERROR
 * - PARSER_ERROR
 * - NORMALIZATION_ERROR
 * - ENTITY_RESOLUTION_ERROR
 * - DATABASE_ERROR
 * - UNKNOWN
 */

export type DPSErrorType =
  | 'AUTH_ERROR'
  | 'RATE_LIMITED'
  | 'TIMEOUT'
  | 'NETWORK_ERROR'
  | 'UPSTREAM_5XX'
  | 'UPSTREAM_MAINTENANCE'
  | 'INVALID_REQUEST'
  | 'SCHEMA_ERROR'
  | 'PARSER_ERROR'
  | 'NORMALIZATION_ERROR'
  | 'ENTITY_RESOLUTION_ERROR'
  | 'DATABASE_ERROR'
  | 'UNKNOWN';

export interface DPSError {
  type: DPSErrorType;
  code: string;
  message: string;
  details?: any;
  timestamp: string;
  upstreamStatus?: number;
  upstreamResponse?: any;
  retryable: boolean;
  userFacing: boolean;
  userFacingMessage?: string;
}

export class DPSErrorClassifier {
  /**
   * Classify error from DPS API response
   */
  static classifyError(
    httpStatus: number,
    responseBody: any,
    errorMessage?: string
  ): DPSError {
    const timestamp = new Date().toISOString();

    // Check for maintenance response
    if (this.isMaintenanceResponse(responseBody)) {
      return {
        type: 'UPSTREAM_MAINTENANCE',
        code: 'DPS_MAINTENANCE',
        message: 'DPS API is under maintenance',
        details: {
          upstreamResponse: responseBody,
          upstreamStatus: httpStatus
        },
        timestamp,
        upstreamStatus: httpStatus,
        upstreamResponse: responseBody,
        retryable: false,
        userFacing: true,
        userFacingMessage: 'ДПС тимчасово недоступна. Причина: технічні роботи на стороні джерела.'
      };
    }

    // Check for authentication errors
    if (httpStatus === 401 || httpStatus === 403) {
      return {
        type: 'AUTH_ERROR',
        code: 'DPS_AUTH_FAILED',
        message: 'DPS authentication failed',
        details: {
          upstreamStatus: httpStatus,
          upstreamResponse: responseBody
        },
        timestamp,
        upstreamStatus: httpStatus,
        upstreamResponse: responseBody,
        retryable: false,
        userFacing: true,
        userFacingMessage: 'Помилка авторизації в ДПС. Перевірте токен.'
      };
    }

    // Check for rate limiting
    if (httpStatus === 429) {
      return {
        type: 'RATE_LIMITED',
        code: 'DPS_RATE_LIMIT_EXCEEDED',
        message: 'DPS rate limit exceeded',
        details: {
          upstreamStatus: httpStatus,
          upstreamResponse: responseBody
        },
        timestamp,
        upstreamStatus: httpStatus,
        upstreamResponse: responseBody,
        retryable: true,
        userFacing: true,
        userFacingMessage: 'Перевищено ліміт запитів до ДПС. Спробуйте пізніше.'
      };
    }

    // Check for invalid request
    if (httpStatus === 400) {
      return {
        type: 'INVALID_REQUEST',
        code: 'DPS_INVALID_REQUEST',
        message: 'Invalid request to DPS API',
        details: {
          upstreamStatus: httpStatus,
          upstreamResponse: responseBody
        },
        timestamp,
        upstreamStatus: httpStatus,
        upstreamResponse: responseBody,
        retryable: false,
        userFacing: true,
        userFacingMessage: 'Невірний формат запиту до ДПС.'
      };
    }

    // Check for not found
    if (httpStatus === 404) {
      return {
        type: 'INVALID_REQUEST',
        code: 'DPS_NOT_FOUND',
        message: 'Resource not found in DPS',
        details: {
          upstreamStatus: httpStatus,
          upstreamResponse: responseBody
        },
        timestamp,
        upstreamStatus: httpStatus,
        upstreamResponse: responseBody,
        retryable: false,
        userFacing: true,
        userFacingMessage: 'Запис не знайдено в реєстрах ДПС.'
      };
    }

    // Check for upstream 5xx errors
    if (httpStatus >= 500 && httpStatus < 600) {
      return {
        type: 'UPSTREAM_5XX',
        code: `DPS_${httpStatus}`,
        message: `DPS server error: ${httpStatus}`,
        details: {
          upstreamStatus: httpStatus,
          upstreamResponse: responseBody
        },
        timestamp,
        upstreamStatus: httpStatus,
        upstreamResponse: responseBody,
        retryable: true,
        userFacing: true,
        userFacingMessage: 'Помилка сервера ДПС. Спробуйте пізніше.'
      };
    }

    // Network errors (no status code)
    if (httpStatus === 0) {
      return {
        type: 'NETWORK_ERROR',
        code: 'DPS_NETWORK_ERROR',
        message: 'Network error connecting to DPS',
        details: {
          errorMessage
        },
        timestamp,
        retryable: true,
        userFacing: true,
        userFacingMessage: 'Помилка мережі при з\'єднанні з ДПС.'
      };
    }

    // Unknown error
    return {
      type: 'UNKNOWN',
      code: 'DPS_UNKNOWN_ERROR',
      message: 'Unknown DPS error',
      details: {
        upstreamStatus: httpStatus,
        upstreamResponse: responseBody,
        errorMessage
      },
      timestamp,
      upstreamStatus: httpStatus,
      upstreamResponse: responseBody,
      retryable: false,
      userFacing: true,
      userFacingMessage: 'Невідома помилка ДПС.'
    };
  }

  /**
   * Check if response indicates maintenance mode
   */
  private static isMaintenanceResponse(responseBody: any): boolean {
    if (!responseBody || typeof responseBody !== 'object') {
      return false;
    }

    // Check for Ukrainian maintenance message
    if (responseBody.error === 'Помилка' && 
        responseBody.error_description === 'Ведуться технічні роботи') {
      return true;
    }

    // Check for English maintenance message
    if (responseBody.error === 'Error' && 
        responseBody.error_description?.toLowerCase().includes('maintenance')) {
      return true;
    }

    return false;
  }

  /**
   * Create schema error
   */
  static createSchemaError(details: any): DPSError {
    return {
      type: 'SCHEMA_ERROR',
      code: 'DPS_SCHEMA_VALIDATION_FAILED',
      message: 'DPS response schema validation failed',
      details,
      timestamp: new Date().toISOString(),
      retryable: false,
      userFacing: false
    };
  }

  /**
   * Create parser error
   */
  static createParserError(details: any): DPSError {
    return {
      type: 'PARSER_ERROR',
      code: 'DPS_PARSING_FAILED',
      message: 'DPS response parsing failed',
      details,
      timestamp: new Date().toISOString(),
      retryable: false,
      userFacing: false
    };
  }

  /**
   * Create normalization error
   */
  static createNormalizationError(details: any): DPSError {
    return {
      type: 'NORMALIZATION_ERROR',
      code: 'DPS_NORMALIZATION_FAILED',
      message: 'DPS data normalization failed',
      details,
      timestamp: new Date().toISOString(),
      retryable: false,
      userFacing: false
    };
  }

  /**
   * Create entity resolution error
   */
  static createEntityResolutionError(details: any): DPSError {
    return {
      type: 'ENTITY_RESOLUTION_ERROR',
      code: 'DPS_ENTITY_RESOLUTION_FAILED',
      message: 'DPS entity resolution failed',
      details,
      timestamp: new Date().toISOString(),
      retryable: false,
      userFacing: false
    };
  }

  /**
   * Create database error
   */
  static createDatabaseError(details: any): DPSError {
    return {
      type: 'DATABASE_ERROR',
      code: 'DPS_DATABASE_ERROR',
      message: 'DPS database operation failed',
      details,
      timestamp: new Date().toISOString(),
      retryable: true,
      userFacing: false
    };
  }

  /**
   * Create timeout error
   */
  static createTimeoutError(details: any): DPSError {
    return {
      type: 'TIMEOUT',
      code: 'DPS_TIMEOUT',
      message: 'DPS request timeout',
      details,
      timestamp: new Date().toISOString(),
      retryable: true,
      userFacing: true,
      userFacingMessage: 'Тайм-аут запиту до ДПС.'
    };
  }
}
