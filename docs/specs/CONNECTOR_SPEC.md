# Connector Specification

Every connector must implement `AbstractConnector` and strictly adhere to:
1. **Timeouts:** Absolute max 5000ms.
2. **Circuit Breakers:** Auto-fail if health is DEGRADED.
3. **No Mocking:** If source is down, return `SOURCE_UNAVAILABLE`.
4. **Standardized Response:** Returns a list of `Claim` objects.

## Abstract Interface
```typescript
interface IConnector {
  sourceId: string;
  fetchData(identifier: string, type: 'IPN' | 'EDRPOU' | 'NAME'): Promise<Claim[]>;
  healthCheck(): Promise<HealthStatus>;
}
```
