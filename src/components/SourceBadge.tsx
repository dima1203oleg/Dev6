import React from "react";
import { Database, ExternalLink } from "lucide-react";
import type { Provenance } from "../services/dataTypes";

interface SourceBadgeProps {
  provenance: Provenance;
  className?: string;
}

const relativeTime = (value: string): string => {
  const seconds = Math.max(0, Math.round((Date.now() - Date.parse(value)) / 1000));
  if (seconds < 60) return `${seconds} с тому`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} хв тому`;
  return `${Math.round(minutes / 60)} год тому`;
};

export default function SourceBadge({ provenance, className = "" }: SourceBadgeProps) {
  return (
    <div className={`flex flex-wrap items-center gap-2 text-[10px] text-slate-400 ${className}`}>
      <span className="inline-flex items-center gap-1 rounded border border-slate-700 bg-slate-900/70 px-2 py-1">
        <Database size={12} className="text-cyan-400" />
        {provenance.sourceName}
      </span>
      <a
        className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300"
        href={provenance.sourceUrl}
        target="_blank"
        rel="noreferrer"
      >
        Джерело
        <ExternalLink size={11} />
      </a>
      <time dateTime={provenance.fetchedAt} title={new Date(provenance.fetchedAt).toLocaleString("uk-UA")}>
        {relativeTime(provenance.fetchedAt)}
      </time>
      {provenance.cached && <span className="rounded bg-slate-800 px-1.5 py-0.5">кеш</span>}
      {provenance.stale && <span className="rounded bg-amber-950 px-1.5 py-0.5 text-amber-300">застарілі дані</span>}
      {provenance.request?.method === "POST" && provenance.request.body?.text && (
        <span className="max-w-[18rem] truncate" title={String(provenance.request.body.text)}>
          запит: {String(provenance.request.body.text)}
        </span>
      )}
    </div>
  );
}
