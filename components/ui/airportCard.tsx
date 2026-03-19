"use client";

import { useState } from "react";

export type AirportInfo = {
  name: string;
  country: string;
  elevation: number;
  localTime: string;
  weather?: { temperature_2m: number; weather_code: number };
};

export function Row({ label, value, valueClass, onCopy }: { label: string; value: React.ReactNode; valueClass?: string; onCopy?: () => void }) {
  return (
    <div className="flex justify-between items-center gap-4">
      <span className="text-white/40 text-xs shrink-0">{label}</span>
      <span className={`text-xs text-right ${valueClass ?? "text-white/80"}`}>{value}</span>
    </div>
  );
}

export default function AirportCard({ icao, info, loading }: { icao: string; info: AirportInfo | null; loading: boolean }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(icao);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="space-y-2">
      <button onClick={handleCopy} className="flex items-center gap-1.5 group">
        <p className="text-xs font-semibold text-white/50 uppercase tracking-wider">{icao}</p>
        <span className="text-white/20 group-hover:text-white/60 transition-colors">
          {copied ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
              <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
            </svg>
          )}
        </span>
      </button>
      <div className="rounded-xl border bg-background border-input px-3 py-3 shadow-sm flex flex-col gap-2">
        {loading && <p className="text-xs text-white/30">Caricamento...</p>}
        {info && (
          <>
            <div className="text-white text-xs font-medium">{info.name}</div>
            <Row label="Stato" value={info.country} />
            <Row label="Altitudine" value={info.elevation ? `${Math.round(info.elevation)} ft` : "—"} />
            <Row label="Orario locale" value={info.localTime ?? "—"} />
            {info.weather && <Row label="Temperatura" value={`${info.weather.temperature_2m}°C`} valueClass="text-blue-400" />}
          </>
        )}
      </div>
    </div>
  );
}
