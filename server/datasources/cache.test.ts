import { TtlCache } from "./cache";
import { describe, expect, it, vi } from "vitest";

describe("TtlCache", () => {
  it("marks expired entries stale and preserves their original fetch time", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-03T00:00:00Z"));
    const cache = new TtlCache<string>(1000);
    cache.write("key", "value", "2026-08-03T00:00:00.000Z");
    vi.advanceTimersByTime(1001);
    expect(cache.read("key")).toMatchObject({
      value: "value",
      cached: true,
      stale: true,
      fetchedAt: "2026-08-03T00:00:00.000Z",
    });
    vi.useRealTimers();
  });
});
