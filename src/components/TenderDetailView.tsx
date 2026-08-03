import React from "react";
import DataState from "./DataState";
import SourceBadge from "./SourceBadge";
import { dataApi } from "../services/dataApi";
import type { DataSourceError, ProzorroTenderDetail, Provenance } from "../services/dataTypes";

const records = (value: unknown): Array<Record<string, unknown>> =>
  Array.isArray(value)
    ? value.filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
    : [];

export default function TenderDetailView({ tenderId, onBack }: { tenderId: string; onBack: () => void }) {
  const [state, setState] = React.useState<{
    loading: boolean;
    data?: ProzorroTenderDetail;
    provenance?: Provenance;
    error?: DataSourceError;
  }>({ loading: true });
  const load = React.useCallback(async () => {
    setState({ loading: true });
    const result = await dataApi.procurementTender(tenderId);
    setState(
      "error" in result
        ? { loading: false, error: result.error }
        : { loading: false, data: result.data, provenance: result.provenance },
    );
  }, [tenderId]);
  React.useEffect(() => {
    void load();
  }, [load]);
  const items = records(state.data?.items);
  const awards = records(state.data?.awards);
  const contracts = records(state.data?.contracts);
  return (
    <main className="space-y-5 p-4 md:p-8">
      <button type="button" onClick={onBack} className="text-sm text-cyan-400 hover:text-cyan-300">
        ← Назад до закупівель
      </button>
      <DataState loading={state.loading} error={state.error} onRetry={() => void load()}>
        {state.data && (
          <>
            <header className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs text-slate-500">{state.data.tenderID}</p>
                  <h1 className="mt-2 text-2xl font-semibold text-white">{state.data.title ?? "Назва недоступна"}</h1>
                </div>
                {state.provenance && <SourceBadge provenance={state.provenance} />}
              </div>
              <div className="mt-5 grid gap-3 text-sm text-slate-300 sm:grid-cols-2 lg:grid-cols-4">
                <p>
                  Статус: <b className="text-white">{state.data.status ?? "недоступний"}</b>
                </p>
                <p>
                  Сума:{" "}
                  <b className="text-white">
                    {state.data.value?.amount?.toLocaleString("uk-UA") ?? "недоступна"}{" "}
                    {state.data.value?.currency ?? ""}
                  </b>
                </p>
                <p>
                  Створено:{" "}
                  <b className="text-white">
                    {typeof state.data.dateCreated === "string" ? state.data.dateCreated : "недоступно"}
                  </b>
                </p>
                <p>
                  Змінено:{" "}
                  <b className="text-white">
                    {typeof state.data.dateModified === "string" ? state.data.dateModified : "недоступно"}
                  </b>
                </p>
              </div>
            </header>
            <section className="grid gap-5 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
                <h2 className="mb-3 font-semibold text-white">Замовник</h2>
                <p className="text-sm text-slate-300">{state.data.procuringEntity?.name ?? "Назва недоступна"}</p>
                <p className="mt-2 text-xs text-slate-400">
                  ЄДРПОУ: {state.data.procuringEntity?.identifier?.id ?? "недоступний"}
                </p>
                <p className="text-xs text-slate-400">
                  Регіон: {state.data.procuringEntity?.address?.region ?? "недоступний"}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
                <h2 className="mb-3 font-semibold text-white">Предмети</h2>
                {items.length ? (
                  items.map((item, index) => (
                    <p key={index} className="border-b border-slate-800 py-2 text-sm text-slate-300">
                      {typeof item.description === "string" ? item.description : "Опис недоступний"} ·{" "}
                      {typeof item.quantity === "number" ? item.quantity : "кількість недоступна"}{" "}
                      {typeof item.unit === "object" &&
                      item.unit !== null &&
                      typeof (item.unit as Record<string, unknown>).name === "string"
                        ? ((item.unit as Record<string, unknown>).name as string)
                        : ""}
                    </p>
                  ))
                ) : (
                  <p className="text-sm text-slate-400">Позиції не опубліковані.</p>
                )}
              </div>
            </section>
            <section className="grid gap-5 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
                <h2 className="mb-3 font-semibold text-white">Рішення / awards</h2>
                {awards.length ? (
                  awards.map((award, index) => (
                    <p key={index} className="text-sm text-slate-300">
                      {typeof award.status === "string" ? award.status : "статус недоступний"} ·{" "}
                      {typeof award.value === "object" &&
                      award.value !== null &&
                      typeof (award.value as Record<string, unknown>).amount === "number"
                        ? ((award.value as Record<string, unknown>).amount as number)
                        : "сума недоступна"}
                    </p>
                  ))
                ) : (
                  <p className="text-sm text-slate-400">Awards не опубліковані.</p>
                )}
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
                <h2 className="mb-3 font-semibold text-white">Контракти</h2>
                {contracts.length ? (
                  contracts.map((contract, index) => (
                    <p key={index} className="text-sm text-slate-300">
                      {typeof contract.status === "string" ? contract.status : "статус недоступний"}
                    </p>
                  ))
                ) : (
                  <p className="text-sm text-slate-400">Контракти не опубліковані.</p>
                )}
              </div>
            </section>
          </>
        )}
      </DataState>
    </main>
  );
}
