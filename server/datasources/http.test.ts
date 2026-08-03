import { describe, expect, it, vi } from "vitest";
import { fetchJson } from "./http";

describe("fetchJson", () => {
  it("retries a transient upstream failure and succeeds", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response("", { status: 503 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    const result = await fetchJson<{ ok: boolean }>("https://example.test/data", { retries: 1 });
    expect(result.data.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    fetchMock.mockRestore();
  });

  it("does not retry client errors", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response("", { status: 400 }));
    await expect(fetchJson("https://example.test/data", { retries: 3 })).rejects.toMatchObject({ code: "http_400" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    fetchMock.mockRestore();
  });
});
