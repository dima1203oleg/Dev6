import { describe, expect, it } from "vitest";
import { buildEvidence } from "./evidence";

describe("buildEvidence", () => {
  it("creates a UUID and deterministic SHA-256 for the upstream payload", () => {
    const first = buildEvidence({ z: 2, nested: { b: true, a: "x" } });
    const second = buildEvidence({ nested: { a: "x", b: true }, z: 2 });

    expect(first.evidenceId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    expect(first.contentHash).toBe(second.contentHash);
    expect(first.contentHash).toMatch(/^sha256-[0-9a-f]{64}$/);
  });
});
