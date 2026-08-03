import React from "react";
import DataState from "./DataState";

export default function UnavailableSurface({ title, source = "цього модуля" }: { title: string; source?: string }) {
  return (
    <main className="p-6">
      <h1 className="mb-4 text-2xl font-semibold text-white">{title}</h1>
      <DataState
        error={{
          code: "source_unavailable",
          message: `Реальне джерело для ${source} не налаштоване`,
          sourceUrl: "",
          attemptedAt: new Date().toISOString(),
        }}
      >
        {null}
      </DataState>
    </main>
  );
}
