// @vitest-environment jsdom

import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import DataState from "./DataState";
import SourceBadge from "./SourceBadge";

describe("SourceBadge", () => {
  it("renders source, cache and stale provenance markers", () => {
    render(
      <SourceBadge
        provenance={{
          source: "nbu",
          sourceName: "Національний банк України",
          sourceUrl: "https://bank.gov.ua",
          fetchedAt: new Date().toISOString(),
          cached: true,
          stale: true,
        }}
      />,
    );
    expect(screen.getByText("Національний банк України")).toBeTruthy();
    expect(screen.getByText("кеш")).toBeTruthy();
    expect(screen.getByText("застарілі дані")).toBeTruthy();
  });
});

describe("DataState", () => {
  it("renders an honest unavailable state and supports retry", () => {
    const retry = vi.fn();
    render(
      <DataState
        error={{
          code: "credentials_missing",
          message: "GEMINI_API_KEY is not configured",
          sourceUrl: "/api",
          attemptedAt: new Date().toISOString(),
        }}
        onRetry={retry}
      >
        <span>hidden data</span>
      </DataState>,
    );
    expect(screen.getByText("Потрібен ключ API: GEMINI_API_KEY is not configured")).toBeTruthy();
    expect(screen.queryByText("hidden data")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Повторити" }));
    expect(retry).toHaveBeenCalledTimes(1);
  });
});
