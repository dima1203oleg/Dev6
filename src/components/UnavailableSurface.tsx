import React from "react";
import DataState from "./DataState";

export default function UnavailableSurface({
  title,
  source = "цього модуля",
  envVar,
}: {
  title: string;
  source?: string;
  envVar?: string;
}) {
  return (
    <main className="p-6">
      <h1 className="mb-4 text-2xl font-semibold text-white">{title}</h1>
      <DataState
        error={{
          code: envVar ? "credentials_missing" : "source_unavailable",
          message: envVar ? envVar : `Реальне джерело для ${source} не налаштоване`,
          sourceUrl: "",
          attemptedAt: new Date().toISOString(),
        }}
      >
        {null}
      </DataState>
    </main>
  );
}
