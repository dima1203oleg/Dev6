/**
 * PREDATOR Analytics - Automated Test Framework
 * TEST-003 — Authentication
 */

import { BaseTest } from '../BaseTest';
import { TestContext, TestResult } from '../types';

export class TEST003_Authentication extends BaseTest {
  constructor() {
    super('TEST-003', 'Authentication');
  }

  async execute(context: TestContext): Promise<TestResult> {
    const { result, durationMs } = await this.measureExecution(async () => {
      const authType = context.source_config.auth_type;
      const details: Record<string, any> = {};
      const errors: string[] = [];
      const warnings: string[] = [];

      details['auth_type'] = authType;

      switch (authType.toUpperCase()) {
        case 'NONE':
          details['authentication_required'] = false;
          details['authentication_status'] = 'NOT_REQUIRED';
          break;

        case 'API_KEY':
          await this.checkApiKeyAuthentication(context, details, errors, warnings);
          break;

        case 'OAUTH':
          await this.checkOAuthAuthentication(context, details, errors, warnings);
          break;

        case 'JWT':
          await this.checkJWTAuthentication(context, details, errors, warnings);
          break;

        case 'BEARER_TOKEN':
          await this.checkBearerTokenAuthentication(context, details, errors, warnings);
          break;

        case 'MTLS':
          await this.checkMTLSAuthentication(context, details, errors, warnings);
          break;

        default:
          warnings.push(`Unknown authentication type: ${authType}`);
          details['authentication_status'] = 'UNKNOWN';
      }

      return { details, errors, warnings };
    });

    const status = this.determineStatus(result.errors, result.warnings);
    return this.createResult(status, result.details, result.errors, result.warnings, durationMs);
  }

  private async checkApiKeyAuthentication(
    context: TestContext,
    details: Record<string, any>,
    errors: string[],
    warnings: string[]
  ): Promise<void> {
    details['authentication_required'] = true;
    details['authentication_method'] = 'API_KEY';

    // Check if API key is configured in environment
    const apiKey = process.env[`${context.source_config.source_id}_API_KEY`] || 
                   process.env[`${context.source_config.connector_id.toUpperCase()}_API_KEY`];

    if (!apiKey) {
      errors.push('API Key not configured in environment');
      details['authentication_status'] = 'MISSING_CREDENTIALS';
    } else {
      details['api_key_configured'] = true;
      details['api_key_length'] = apiKey.length;
      details['api_key_prefix'] = apiKey.substring(0, 4) + '...';
      
      // Validate API key format (basic check)
      if (apiKey.length < 8) {
        warnings.push('API key appears to be too short');
      }
      
      details['authentication_status'] = 'CONFIGURED';
    }
  }

  private async checkOAuthAuthentication(
    context: TestContext,
    details: Record<string, any>,
    errors: string[],
    _warnings: string[]
  ): Promise<void> {
    details['authentication_required'] = true;
    details['authentication_method'] = 'OAUTH';

    const clientId = process.env[`${context.source_config.source_id}_CLIENT_ID`] ||
                     process.env[`${context.source_config.connector_id.toUpperCase()}_CLIENT_ID`];
    const clientSecret = process.env[`${context.source_config.source_id}_CLIENT_SECRET`] ||
                         process.env[`${context.source_config.connector_id.toUpperCase()}_CLIENT_SECRET`];

    if (!clientId || !clientSecret) {
      errors.push('OAuth credentials not configured in environment');
      details['authentication_status'] = 'MISSING_CREDENTIALS';
    } else {
      details['client_id_configured'] = true;
      details['client_secret_configured'] = true;
      details['authentication_status'] = 'CONFIGURED';
    }
  }

  private async checkJWTAuthentication(
    context: TestContext,
    details: Record<string, any>,
    errors: string[],
    _warnings: string[]
  ): Promise<void> {
    details['authentication_required'] = true;
    details['authentication_method'] = 'JWT';

    const jwtSecret = process.env[`${context.source_config.source_id}_JWT_SECRET`] ||
                      process.env[`${context.source_config.connector_id.toUpperCase()}_JWT_SECRET`];

    if (!jwtSecret) {
      errors.push('JWT secret not configured in environment');
      details['authentication_status'] = 'MISSING_CREDENTIALS';
    } else {
      details['jwt_secret_configured'] = true;
      details['authentication_status'] = 'CONFIGURED';
    }
  }

  private async checkBearerTokenAuthentication(
    context: TestContext,
    details: Record<string, any>,
    errors: string[],
    _warnings: string[]
  ): Promise<void> {
    details['authentication_required'] = true;
    details['authentication_method'] = 'BEARER_TOKEN';

    const bearerToken = process.env[`${context.source_config.source_id}_BEARER_TOKEN`] ||
                        process.env[`${context.source_config.connector_id.toUpperCase()}_BEARER_TOKEN`];

    if (!bearerToken) {
      errors.push('Bearer token not configured in environment');
      details['authentication_status'] = 'MISSING_CREDENTIALS';
    } else {
      details['bearer_token_configured'] = true;
      details['token_length'] = bearerToken.length;
      details['authentication_status'] = 'CONFIGURED';
    }
  }

  private async checkMTLSAuthentication(
    context: TestContext,
    details: Record<string, any>,
    errors: string[],
    _warnings: string[]
  ): Promise<void> {
    details['authentication_required'] = true;
    details['authentication_method'] = 'MTLS';

    const certPath = process.env[`${context.source_config.source_id}_CERT_PATH`] ||
                    process.env[`${context.source_config.connector_id.toUpperCase()}_CERT_PATH`];
    const keyPath = process.env[`${context.source_config.source_id}_KEY_PATH`] ||
                   process.env[`${context.source_config.connector_id.toUpperCase()}_KEY_PATH`];

    if (!certPath || !keyPath) {
      errors.push('mTLS certificate paths not configured in environment');
      details['authentication_status'] = 'MISSING_CREDENTIALS';
    } else {
      details['cert_path_configured'] = true;
      details['key_path_configured'] = true;
      details['authentication_status'] = 'CONFIGURED';
    }
  }

}
