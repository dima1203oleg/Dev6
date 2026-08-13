/**
 * DPS Connector Test Script
 * 
 * Tests DPS connector with real API token
 * Token should be provided via environment variable DPS_TAX_CABINET_API_TOKEN
 * Test EDRPOU: 3111724753
 */

import { getDPSTokenManager, resetDPSTokenManager } from './DPSTokenManager';
import { getDPSConnector, resetDPSConnector } from './DPSConnector';
import { getDPSRateLimiter, resetDPSRateLimiter } from './DPSRateLimiter';
import { getDPSCircuitBreaker, resetDPSCircuitBreaker } from './DPSCircuitBreaker';
import { resetDPSRetryPolicy } from './DPSRetryPolicy';

async function testDPSConnector() {
  const token = process.env['DPS_TAX_CABINET_API_TOKEN'];
  if (!token) {
    console.error('ERROR: DPS_TAX_CABINET_API_TOKEN environment variable not set');
    process.exit(1);
  }

  console.log('=== DPS Connector Test ===');
  console.log('Test EDRPOU: 3111724753');
  console.log('');

  // Reset singletons
  resetDPSTokenManager();
  resetDPSConnector();
  resetDPSRateLimiter();
  resetDPSCircuitBreaker();
  resetDPSRetryPolicy();

  // Initialize token manager with real token from environment
  const tokenManager = getDPSTokenManager({
    tokens: [token],
    maxRequestsPerDay: 1000,
    warningThreshold: 70,
    highWarningThreshold: 85,
    criticalThreshold: 95,
    rotationEnabled: true
  });

  console.log('✓ Token manager initialized');
  console.log('Token quota status:', tokenManager.getQuotaStatus());
  console.log('');

  // Test 1: Health check
  console.log('Test 1: Health check');
  try {
    const connector = getDPSConnector();
    const health = await connector.health_check();
    console.log('Health status:', health);
    console.log('✓ Health check passed');
  } catch (error: any) {
    console.error('✗ Health check failed:', error.message);
  }
  console.log('');

  // Test 2: Fetch primary endpoint (Tax Registration)
  console.log('Test 2: Fetch Tax Registration for EDRPOU 3111724753');
  try {
    const connector = getDPSConnector();
    const result = await connector.fetch('3111724753', 'registration');
    console.log('Response status:', result.status);
    console.log('Response data:', JSON.stringify(result.normalizedData, null, 2));
    console.log('✓ Tax Registration fetch passed');
  } catch (error: any) {
    console.error('✗ Tax Registration fetch failed:', error.message);
  }
  console.log('');

  // Test 3: Fetch VAT Payers
  console.log('Test 3: Fetch VAT Payers for EDRPOU 3111724753');
  try {
    const connector = getDPSConnector();
    const result = await connector.fetch('3111724753', 'vat');
    console.log('Response status:', result.status);
    console.log('Response data:', JSON.stringify(result.normalizedData, null, 2));
    console.log('✓ VAT Payers fetch passed');
  } catch (error: any) {
    console.error('✗ VAT Payers fetch failed:', error.message);
  }
  console.log('');

  // Test 4: Check token quota after requests
  console.log('Test 4: Token quota status after requests');
  console.log('Token quota status:', tokenManager.getQuotaStatus());
  console.log('');

  // Test 5: Check rate limiter status
  console.log('Test 5: Rate limiter status');
  const rateLimiter = getDPSRateLimiter();
  console.log('Rate limiter status:', rateLimiter.getStatus());
  console.log('');

  // Test 6: Check circuit breaker status
  console.log('Test 6: Circuit breaker status');
  const circuitBreaker = getDPSCircuitBreaker();
  console.log('Circuit breaker status:', circuitBreaker.getStatus());
  console.log('');

  console.log('=== DPS Connector Test Complete ===');
}

// Run test
testDPSConnector().catch(console.error);
