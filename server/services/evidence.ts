import { createHash, randomUUID } from "node:crypto";

const canonicalize = (value: unknown): string => {
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => `${JSON.stringify(key)}:${canonicalize(entry)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
};

export const buildEvidence = (payload: unknown): { evidenceId: string; contentHash: string } => ({
  evidenceId: randomUUID(),
  contentHash: `sha256-${createHash("sha256").update(canonicalize(payload)).digest("hex")}`,
});
