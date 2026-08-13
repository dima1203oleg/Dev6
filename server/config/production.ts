interface TokenConfiguration {
  token: string;
  id: string;
  email: string;
  role: string;
  tenantId: string;
}

function isValidTokenConfiguration(value: unknown): value is TokenConfiguration[] {
  return Array.isArray(value) && value.length > 0 && value.every((entry) => {
    if (typeof entry !== 'object' || entry === null) return false;
    const candidate = entry as Partial<TokenConfiguration>;
    return typeof candidate.token === 'string'
      && candidate.token.length >= 32
      && typeof candidate.id === 'string'
      && typeof candidate.email === 'string'
      && typeof candidate.role === 'string'
      && typeof candidate.tenantId === 'string';
  });
}

/** Fails closed before the HTTP listener opens in production. */
export function assertProductionConfiguration(): void {
  if (process.env['NODE_ENV'] !== 'production') return;

  const missing = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD', 'AUTH_TOKENS']
    .filter((name) => !process.env[name]);
  if (missing.length > 0) {
    throw new Error(`Production configuration is incomplete: ${missing.join(', ')}.`);
  }

  try {
    const tokens: unknown = JSON.parse(process.env['AUTH_TOKENS'] || '');
    if (!isValidTokenConfiguration(tokens)) {
      throw new Error('AUTH_TOKENS must be a non-empty JSON token list with 32+ character tokens.');
    }
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('AUTH_TOKENS')) throw error;
    throw new Error('AUTH_TOKENS must be valid JSON.');
  }

  const origins = process.env['ALLOWED_ORIGINS'];
  if (!origins || origins.split(',').map((origin) => origin.trim()).filter(Boolean).length === 0) {
    throw new Error('Production configuration is incomplete: ALLOWED_ORIGINS is required.');
  }
}
