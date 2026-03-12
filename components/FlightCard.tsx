"use client";

import { useState } from "react";
import { markAsDone, deleteFlight } from "@/lib/actions";
import type { Flight } from "@/db/schema";
import RouteMapPreviewWrapper from "./RouteMapPreviewWrapper";
import type { RouteCoords } from "./FlightForm";

type AirportInfo = {
  name: string;
  country: string;
  elevation: number;
  localTime: string;
  weather?: { temperature_2m: number; weather_code: number };
};

function haversineNm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3440.065;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDuration(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}h ${m.toString().padStart(2, "0")}m`;
}

function Row({ label, value, valueClass, onCopy }: { label: string; value: React.ReactNode; valueClass?: string; onCopy?: () => void }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    onCopy?.();
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="flex justify-between items-center gap-4">
      <span className="text-white/40 text-xs shrink-0">{label}</span>
      <div className="flex items-center gap-1.5">
        <span className={`text-xs text-right ${valueClass ?? "text-white/80"}`}>{value}</span>
        {onCopy && (
          <button onClick={handleCopy} className="text-white/20 hover:text-white/60 transition-colors shrink-0">
            {copied ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
              </svg>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

function AirportCard({ icao, info, loading }: { icao: string; info: AirportInfo | null; loading: boolean }) {
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
      <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 flex flex-col gap-2">
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

export default function FlightCard({ flight }: { flight: Flight }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [depInfo, setDepInfo] = useState<AirportInfo | null>(null);
  const [arrInfo, setArrInfo] = useState<AirportInfo | null>(null);
  const [loadingDep, setLoadingDep] = useState(false);
  const [loadingArr, setLoadingArr] = useState(false);

  const route: RouteCoords =
    flight.departureLat && flight.departureLon && flight.arrivalLat && flight.arrivalLon
      ? { depLat: flight.departureLat, depLon: flight.departureLon, arrLat: flight.arrivalLat, arrLon: flight.arrivalLon, depName: flight.departure, arrName: flight.arrival }
      : null;

  const flightStats = route
    ? (() => {
        const dist = haversineNm(route.depLat, route.depLon, route.arrLat, route.arrLon);
        return { dist: Math.round(dist), duration: formatDuration(dist / 450) };
      })()
    : null;

  async function openModal() {
    setModalOpen(true);
    if (!depInfo) {
      setLoadingDep(true);
      const res = await fetch(`/api/airport?icao=${flight.departure}`);
      const data = await res.json();
      setDepInfo(data);
      setLoadingDep(false);
    }
    if (!arrInfo) {
      setLoadingArr(true);
      const res = await fetch(`/api/airport?icao=${flight.arrival}`);
      const data = await res.json();
      setArrInfo(data);
      setLoadingArr(false);
    }
  }

  async function copyToClipboard(text: string) {
    await navigator.clipboard.writeText(text);
  }

  return (
    <>
      {/* Card */}
      <div onClick={openModal} className="bg-nero border border-zinc-800 rounded-xl p-5 flex justify-between items-start gap-4 cursor-pointer hover:border-zinc-600 transition-colors">
        <div className="flex flex-col gap-3 w-12/12">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "rgba(59, 130, 246, 0.15)" }}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-5 h-5"
                style={{ color: "rgb(59, 130, 246)" }}
              >
                <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">
                {flight.departure} - {flight.arrival}
              </h2>
              {/* <p className="text-xs text-white/40">Plan your next route</p> */}
            </div>
          </div>
          <div className="flex flex-row gap-3">
            <div className="w-1/2 rounded-xl border border-white/8 bg-white/3 px-4 py-3 flex flex-col gap-2">
              {flight.aircraft && <Row label="Tipo aereo" value={flight.aircraft} />}
              {flight.tailNumber && <Row label="Numero di coda" value={flight.tailNumber} valueClass="text-white/80 font-mono" onCopy={() => navigator.clipboard.writeText(flight.tailNumber!)} />}
              {flight.flightNumber && <Row label="Numero volo" value={flight.flightNumber} valueClass="text-blue-400 font-mono" onCopy={() => navigator.clipboard.writeText(flight.flightNumber!)} />}
              {flight.notes && <Row label="Note" value={flight.notes} />}
            </div>
            {flightStats && (
              <div className="w-1/2 rounded-xl border border-white/8 bg-white/3 px-4 py-3 flex justify-between items-center text-xs">
                <div className="flex flex-col gap-0.5">
                  <span className="text-white/40">Distanza</span>
                  <span className="text-white font-medium">{flightStats.dist} NM</span>
                </div>
                <div className="w-px h-8 bg-white/8" />
                <div className="flex flex-col gap-0.5 items-end">
                  <span className="text-white/40">Tempo stimato</span>
                  <span className="text-blue-400 font-semibold">{flightStats.duration}</span>
                </div>
              </div>
            )}
          </div>
        </div>
        {!flight.done ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              markAsDone(flight.id);
            }}
            className="shrink-0 text-sm bg-zinc-800 hover:bg-green-700 text-zinc-300 hover:text-white px-3 py-1.5 rounded-lg transition-colors"
          >
            ✓ Fatto
          </button>
        ) : (
          <span className="shrink-0 text-sm text-green-500 font-medium">✓ Completato</span>
        )}
      </div>

      {/* Modal */}
      <div
        className={`fixed inset-0 z-1000 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 transition-opacity duration-200 ${
          modalOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={(e) => {
          if (e.target === e.currentTarget) setModalOpen(false);
        }}
      >
        <div className="flex w-10/12 max-h-[90vh] rounded-3xl border border-white/8 bg-[#1A1A24] shadow-2xl overflow-hidden">
          {/* Sinistra — dettagli */}
          <div className="w-7/12 shrink-0 flex flex-col overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 pb-4 sticky top-0 bg-[#1A1A24] z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "rgba(59, 130, 246, 0.15)" }}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ color: "rgb(59, 130, 246)" }}
                  >
                    <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    {flight.departure} → {flight.arrival}
                  </h2>
                  <p className="text-xs text-white/40">
                    {flight.flightNumber ?? "Volo privato"} · {new Date(flight.createdAt).toLocaleDateString("it-IT", { day: "2-digit", month: "short", year: "numeric" })}
                  </p>
                </div>
              </div>
              <button onClick={() => setModalOpen(false)} className="w-8 h-8 rounded-xl flex items-center justify-center bg-white/[0.06] hover:bg-white/[0.1] transition-colors">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-white/50"
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>

            <div className="px-6 pb-6 flex flex-col gap-5">
              {/* Aeroporti */}
              <div className="grid grid-cols-2 gap-3">
                <AirportCard icao={flight.departure} info={depInfo} loading={loadingDep} />
                <AirportCard icao={flight.arrival} info={arrInfo} loading={loadingArr} />
              </div>

              {/* Stima */}
              {flightStats && (
                <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 flex justify-between items-center text-xs">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-white/40">Distanza</span>
                    <span className="text-white font-medium">{flightStats.dist} NM</span>
                  </div>
                  <div className="w-px h-8 bg-white/[0.08]" />
                  <div className="flex flex-col gap-0.5 items-end">
                    <span className="text-white/40">Tempo stimato</span>
                    <span className="text-blue-400 font-semibold">{flightStats.duration}</span>
                  </div>
                </div>
              )}

              {/* Flight details */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-white/50 uppercase tracking-wider">Flight Details</p>
                <div className="rounded-xl border border-white/8 bg-white/3 px-4 py-3 flex flex-col gap-2">
                  {flight.aircraft && <Row label="Tipo aereo" value={flight.aircraft} />}
                  {flight.tailNumber && <Row label="Numero di coda" value={flight.tailNumber} valueClass="text-white/80 font-mono" onCopy={() => navigator.clipboard.writeText(flight.tailNumber!)} />}
                  {flight.flightNumber && (
                    <Row label="Numero volo" value={flight.flightNumber} valueClass="text-blue-400 font-mono" onCopy={() => navigator.clipboard.writeText(flight.flightNumber!)} />
                  )}
                  {flight.notes && <Row label="Note" value={flight.notes} />}
                  <Row label="Stato" value={flight.done ? "✓ Completato" : "⏳ Da fare"} valueClass={flight.done ? "text-green-500" : "text-yellow-500"} />
                  <Row label="Aggiunto il" value={new Date(flight.createdAt).toLocaleDateString("it-IT", { day: "2-digit", month: "short", year: "numeric" })} />
                </div>
              </div>

              {/* Azioni */}
              <div className="flex flex-row gap-3">
                {flight.flightradarUrl && (
                  <a
                    href={flight.flightradarUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full text-center text-sm font-semibold text-white py-2.5 rounded-2xl bg-orange-600/40 hover:bg-orange-500 transition-colors border border-orange-600"
                  >
                    🔍 Apri su Flightradar24
                  </a>
                )}
                {!flight.done && (
                  <button
                    onClick={() => {
                      markAsDone(flight.id);
                      setModalOpen(false);
                    }}
                    className="w-full text-sm font-semibold text-white py-2.5 rounded-2xl border cursor-pointer bg-green-700/40 border-green-700 hover:bg-green-600 transition-colors"
                  >
                    ✓ Segna come fatto
                  </button>
                )}
                <button
                  onClick={() => {
                    deleteFlight(flight.id);
                    setModalOpen(false);
                  }}
                  className="shrink-0 text-sm font-semibold text-white py-2.5 px-4 rounded-2xl border cursor-pointer bg-red-700/40 border-red-700 hover:bg-red-600 transition-colors"
                >
                  🗑
                </button>
              </div>
            </div>
          </div>

          {/* Destra — mappa */}
          <div className="flex-1 border-l border-white/[0.06]">
            <RouteMapPreviewWrapper route={route} />
          </div>
        </div>
      </div>
    </>
  );
}
