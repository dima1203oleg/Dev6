export type CircuitBreakerState = "CLOSED" | "OPEN" | "HALF_OPEN";

export class OpendatabotCircuitBreaker {
  private static instance: OpendatabotCircuitBreaker;
  private state: CircuitBreakerState = "CLOSED";
  private failureCount = 0;
  private readonly threshold = 5; // failures
  private readonly cooldownMs = 15000; // 15 seconds cooldown
  private lastStateChange: number = Date.now();

  private constructor() {}

  public static getInstance(): OpendatabotCircuitBreaker {
    if (!OpendatabotCircuitBreaker.instance) {
      OpendatabotCircuitBreaker.instance = new OpendatabotCircuitBreaker();
    }
    return OpendatabotCircuitBreaker.instance;
  }

  public canRequest(): boolean {
    const now = Date.now();
    if (this.state === "OPEN") {
      if (now - this.lastStateChange >= this.cooldownMs) {
        this.transitionTo("HALF_OPEN");
        return true;
      }
      return false;
    }
    return true;
  }

  public onSuccess(): void {
    this.failureCount = 0;
    if (this.state === "HALF_OPEN") {
      this.transitionTo("CLOSED");
    }
  }

  public onFailure(): void {
    this.failureCount++;
    if (this.state === "CLOSED" && this.failureCount >= this.threshold) {
      this.transitionTo("OPEN");
    } else if (this.state === "HALF_OPEN") {
      this.transitionTo("OPEN");
    }
  }

  public getState(): CircuitBreakerState {
    // Check if cooldown expired while OPEN
    if (this.state === "OPEN" && Date.now() - this.lastStateChange >= this.cooldownMs) {
      return "HALF_OPEN";
    }
    return this.state;
  }

  private transitionTo(newState: CircuitBreakerState): void {
    this.state = newState;
    this.lastStateChange = Date.now();
    console.warn(`[OpendatabotCircuitBreaker] Transitioned to ${newState}`);
  }
}

export const circuitBreaker = OpendatabotCircuitBreaker.getInstance();
