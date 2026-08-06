# PREDATOR Analytics - Automated Test Framework

Comprehensive automated testing system for validating all 170+ data sources according to the Master Automated Test Specification.

## Overview

This framework executes 17 different tests on each data source to validate:
- Configuration and metadata
- Connectivity and authentication
- Query execution and response handling
- Data integrity and parsing
- Provenance and freshness
- Entity resolution and cross-validation
- Security and performance
- Fault tolerance

## Test Suite

### TEST-001: Registry Discovery
Validates source configuration including:
- Registry ID format
- Source name
- Endpoint validity
- Access type
- Configuration completeness

### TEST-002: Connectivity
Checks network connectivity:
- DNS resolution
- HTTPS/TLS validation
- HTTP status codes
- Timeout handling
- Retry capability
- Circuit breaker status

### TEST-003: Authentication
Validates authentication mechanisms:
- API Key configuration
- OAuth credentials
- JWT tokens
- Bearer tokens
- mTLS certificates

### TEST-004: Query Execution
Executes test query (IPN: 3111724753):
- Request execution
- Response time measurement
- HTTP code validation
- Error handling

### TEST-005: Raw Response
Captures and validates raw response:
- Complete response body
- HTTP headers
- Content-Type validation
- Size and checksum
- SHA-256 hash

### TEST-006: Schema Validation
Validates response structure:
- Schema compliance
- Required fields
- Field types
- Data format

### TEST-007: Parser Validation
Validates data parsing:
- Type correctness
- UTF-8 encoding
- Null handling
- Required/optional fields

### TEST-008: Data Integrity
Checks data quality:
- Character loss detection
- Data corruption
- Encoding issues
- Consistency validation

### TEST-009: Provenance
Validates provenance metadata:
- source_id presence
- record_id presence
- timestamp presence
- parser_version presence
- confidence scores
- raw fragment references

### TEST-010: Freshness
Validates data freshness:
- Last updated timestamp
- Data age calculation
- TTL validation
- Cache status

### TEST-011: Entity Resolution
Checks entity data:
- Duplicate detection
- Historical records
- Transliteration issues
- Name changes
- Entity relationships

### TEST-012: Cross Validation
Compares across sources:
- Data matching
- Discrepancy detection
- Contradiction identification
- Internal consistency

### TEST-013: No Hallucination
Ensures data authenticity:
- No fabricated values
- Proper null handling (NOT_FOUND, UNKNOWN, NOT_APPLICABLE)
- No generic/placeholder values
- Provenance verification
- AI pattern detection

### TEST-014: Repeatability
Validates reproducibility:
- Identical query execution
- Response consistency
- Checksum validation
- Time variance analysis

### TEST-015: Performance
Measures performance metrics:
- Latency measurement
- Throughput calculation
- CPU usage
- Memory usage
- Retry count

### TEST-016: Fault Injection
Tests fault tolerance:
- Timeout handling
- HTTP 500 errors
- HTTP 429 rate limiting
- TLS errors
- DNS errors
- Broken JSON
- Empty responses

### TEST-017: Security
Tests security vulnerabilities:
- SQL injection
- XSS
- SSRF
- IDOR
- Secret leakage
- Path traversal
- Command injection
- Security headers

## Installation

```bash
# Dependencies are already in package.json
npm install
```

## Configuration

### Environment Variables

Configure authentication credentials in `.env`:

```bash
# Source-specific API keys
UA-001_API_KEY=your_api_key_here
UA-002_API_KEY=your_api_key_here
INT-001_API_KEY=your_api_key_here

# OAuth credentials
UA-001_CLIENT_ID=your_client_id
UA-001_CLIENT_SECRET=your_client_secret

# JWT secrets
UA-001_JWT_SECRET=your_jwt_secret

# Bearer tokens
UA-001_BEARER_TOKEN=your_bearer_token

# mTLS certificates
UA-001_CERT_PATH=/path/to/cert.pem
UA-001_KEY_PATH=/path/to/key.pem
```

### Source Configuration

Edit `server/config/sourceMatrix.yaml` to add or modify sources:

```yaml
sources:
  - source_id: "UA-001"
    source_name: "Єдиний державний реєстр (ЄДР)"
    owner: "Міністерство юстиції України"
    country: "UA"
    category: "Державний реєстр"
    access_level: "FREE_AUTO"
    official_url: "https://usr.minjust.gov.ua/"
    endpoint_or_resource: "https://data.gov.ua/api/3/action/datastore_search"
    connector_id: "edr_connector"
    connector_version: "1.0.0"
    protocol: "REST API"
    format: "JSON"
    encoding: "UTF-8"
    auth_type: "NONE"
    supported_entities: 
      - "COMPANY"
      - "FOP"
      - "PERSON"
    supported_identifiers: 
      - "edrpou"
      - "ipn"
      - "name"
    update_frequency: "DAILY"
    rate_limit: 60
    schema_version: "1.0"
    production_ready: true
```

## Usage

### Basic Usage

Run all tests for all sources:

```bash
npm run test:automated
```

Or directly:

```bash
tsx server/tests/automated/runTests.ts
```

### Advanced Usage

Test specific sources:

```bash
tsx server/tests/automated/runTests.ts --sources UA-001,UA-002,INT-001
```

Run in production environment:

```bash
tsx server/tests/automated/runTests.ts --environment PRODUCTION
```

Custom test IPN:

```bash
tsx server/tests/automated/runTests.ts --ipn 1234567890
```

Custom timeout and retries:

```bash
tsx server/tests/automated/runTests.ts --timeout 60000 --retries 5
```

Custom output directory:

```bash
tsx server/tests/automated/runTests.ts --output ./custom-reports
```

Generate only specific report formats:

```bash
tsx server/tests/automated/runTests.ts --no-markdown --no-csv
```

### Command Line Options

```
-e, --environment <env>    Test environment (QA, INTEGRATION, PRODUCTION) [default: QA]
-i, --ipn <ipn>           Test IPN [default: 3111724753]
-t, --timeout <ms>        Request timeout in milliseconds [default: 30000]
-r, --retries <count>     Number of retries [default: 3]
-o, --output <dir>        Output directory for reports [default: ./test-reports]
-c, --config <path>       Path to source configuration file [default: ./server/config/sourceMatrix.yaml]
-s, --sources <ids>       Comma-separated list of source IDs to test
--no-json                 Skip JSON report generation
--no-markdown             Skip Markdown report generation
--no-csv                  Skip CSV report generation
--no-console              Skip console output
-h, --help                Show help message
```

## Output

The framework generates three types of reports:

### JSON Report
Complete machine-readable report with all test results and metadata.

### Markdown Report
Human-readable report with formatted tables and summaries.

### CSV Report
Tabular data suitable for spreadsheet analysis.

### Console Output
Real-time progress and summary displayed in the terminal.

## Report Structure

### Source Report

Each source receives a detailed report including:

- **Registry ID**: Source identifier
- **Registry Name**: Source name
- **Endpoint**: API endpoint
- **Access Type**: Access level (FREE_AUTO, FREE_API_KEY, etc.)
- **Query Status**: Query execution status
- **HTTP Code**: HTTP response code
- **Response Time**: Query execution time
- **Data Returned**: Whether data was returned
- **Provenance Complete**: Whether provenance metadata is complete
- **Freshness Acceptable**: Whether data is fresh enough
- **Conflicts Detected**: Number of cross-source conflicts
- **Confidence Score**: Overall confidence score (0-1)
- **Final Status**: PASS, PASS_WITH_WARNINGS, PARTIAL, FAIL, BLOCKED, NOT_APPLICABLE
- **QA Notes**: Warnings and errors from all tests
- **Test Results**: Detailed results for each of the 17 tests

### Summary Report

Aggregate statistics including:

- Total sources tested
- Sources passed/failed by status
- Production readiness criteria validation
- Overall production readiness determination

## Status Values

- **PASS**: All tests passed successfully
- **PASS_WITH_WARNINGS**: All critical tests passed, some warnings
- **PARTIAL**: Some non-critical tests failed
- **FAIL**: Critical tests failed
- **BLOCKED**: Source is blocked from testing
- **NOT_APPLICABLE**: Test is not applicable to this source

## Production Readiness Criteria

A source is considered production-ready only if:

1. All critical tests pass (TEST-001, TEST-002, TEST-003, TEST-004, TEST-013)
2. No hallucinations or unconfirmed values
3. All values have provenance metadata
4. Conflicts between sources are documented
5. Results are reproducible
6. Logging is complete
7. Automated tests pass without critical errors

## Architecture

```
server/tests/automated/
├── types.ts                    # Type definitions
├── BaseTest.ts                 # Base test class
├── TestOrchestrator.ts         # Test orchestration
├── ReportGenerator.ts          # Report generation
├── runTests.ts                 # Main test runner
├── tests/
│   ├── TEST001_RegistryDiscovery.ts
│   ├── TEST002_Connectivity.ts
│   ├── TEST003_Authentication.ts
│   ├── TEST004_QueryExecution.ts
│   ├── TEST005_RawResponse.ts
│   ├── TEST006_SchemaValidation.ts
│   ├── TEST007_ParserValidation.ts
│   ├── TEST008_DataIntegrity.ts
│   ├── TEST009_Provenance.ts
│   ├── TEST010_Freshness.ts
│   ├── TEST011_EntityResolution.ts
│   ├── TEST012_CrossValidation.ts
│   ├── TEST013_NoHallucination.ts
│   ├── TEST014_Repeatability.ts
│   ├── TEST015_Performance.ts
│   ├── TEST016_FaultInjection.ts
│   └── TEST017_Security.ts
└── README.md                   # This file
```

## Extending the Framework

### Adding a New Test

1. Create a new test class extending `BaseTest`:

```typescript
import { BaseTest } from '../BaseTest';
import { TestContext, TestResult, TestStatus } from '../types';

export class TEST018_CustomTest extends BaseTest {
  constructor() {
    super('TEST-018', 'Custom Test Name');
  }

  async execute(context: TestContext): Promise<TestResult> {
    const { result, durationMs } = await this.measureExecution(async () => {
      const details: Record<string, any> = {};
      const errors: string[] = [];
      const warnings: string[] = [];

      // Your test logic here

      return { details, errors, warnings };
    });

    const status = this.determineStatus(result.errors, result.warnings);
    return this.createResult(status, result.details, result.errors, result.warnings, durationMs);
  }

  private determineStatus(errors: string[], warnings: string[]): TestStatus {
    if (errors.length > 0) return 'FAIL';
    if (warnings.length > 0) return 'PASS_WITH_WARNINGS';
    return 'PASS';
  }
}
```

2. Add the test to `TestOrchestrator.ts`:

```typescript
import { TEST018_CustomTest } from './tests/TEST018_CustomTest';

// In constructor:
this.tests.push(new TEST018_CustomTest());
```

3. Update the test descriptions in `ReportGenerator.ts`.

## Troubleshooting

### Common Issues

**Authentication Failures**
- Ensure API keys are set in environment variables
- Check that credentials are valid and not expired
- Verify the correct auth_type is set in source configuration

**Timeout Errors**
- Increase timeout value with `--timeout` flag
- Check network connectivity
- Verify endpoint is accessible

**Schema Validation Failures**
- Check if source API has changed
- Update schema_version in source configuration
- Review schema validation logic for the specific source

**Cross-Validation Errors**
- Ensure multiple sources are being tested
- Check that sources return compatible data
- Review entity matching logic

## Contributing

When adding new features or tests:

1. Follow the existing code structure
2. Add appropriate type definitions
3. Include comprehensive error handling
4. Update documentation
5. Test with multiple sources

## License

This framework is part of the PREDATOR Analytics project.
