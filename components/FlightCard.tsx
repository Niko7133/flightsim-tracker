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
      <div className="rounded-xl border bg-background border-input px-3 py-3  shadow-sm flex flex-col gap-2">
        {loading && <p className="text-xs text-white/30">Caricamento...</p>}
        {info && (
          <>
            <div className="text-white text-xs font-medium">{info.name}</div>
            <Row label="Stato" value={info.country} />
            <Row label="Altitudine" value={info.elevation ? `${Math.round(info.elevation)} ft` : "—"} />
            <Row label="Orario locale" value={info.localTime ?? "—"} />
            {info.weather && <Row label="Temperatura" value={`${info.weather.temperature_2m}°C`} className="text-blue-400" />}
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
  const [airline, setAirline] = useState<{ name: string; country: string } | null>(null);

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
    if (!airline && flight.flightNumber) {
      const res = await fetch(`/api/airline?flight=${flight.flightNumber}`);
      const data = await res.json();
      setAirline(data);
    }
  }

  async function copyToClipboard(text: string) {
    await navigator.clipboard.writeText(text);
  }

  return (
    <>
      {/* Card */}
      <div className="group relative bg-card rounded-2xl border overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 opacity-70 border-border/60">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary/40"></div>
        <div className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2.5">
                <span className="font-bold text-lg tracking-wide text-foreground">{flight.departure}</span>
                <div className="flex items-center gap-1 text-primary">
                  <div className="h-px w-8 bg-primary/40"></div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    className="lucide lucide-plane w-3.5 h-3.5 rotate-0"
                  >
                    <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"></path>
                  </svg>
                  <div className="h-px w-8 bg-primary/40"></div>
                </div>
                <span className="font-bold text-lg tracking-wide text-foreground">{flight.arrival}</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={openModal}
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent  h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                id="openModalFlight"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  className="lucide lucide-pencil w-3.5 h-3.5"
                >
                  <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"></path>
                  <path d="m15 5 4 4"></path>
                </svg>
              </button>
              <button
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg]:size-4 [&amp;_svg]:shrink-0 hover:bg-accent h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                onClick={() => deleteFlight(flight.id)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  className="lucide lucide-trash2 w-3.5 h-3.5"
                >
                  <path d="M3 6h18"></path>
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                  <line x1="10" x2="10" y1="11" y2="17"></line>
                  <line x1="14" x2="14" y1="11" y2="17"></line>
                </svg>
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="bg-muted/60 rounded-lg px-3 py-2">
              <div className="text-xs text-muted-foreground mb-0.5">Aereo</div>
              <div className="text-sm font-medium text-foreground truncate">{flight.aircraft}</div>
            </div>
            <div className="bg-muted/60 rounded-lg px-3 py-2">
              <div className="text-xs text-muted-foreground mb-0.5">Coda</div>
              <div className="text-sm font-medium text-foreground truncate">{flight.tailNumber}</div>
            </div>
            {airline && (
              <div className="bg-muted/60 rounded-lg px-3 py-2">
                <div className="text-xs text-muted-foreground mb-0.5">Compagnia</div>
                <div className="text-sm font-medium text-foreground truncate">{airline.name}</div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3 mb-3 px-1">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                className="lucide lucide-ruler w-3 h-3 text-primary/70"
              >
                <path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.41 2.41 0 0 1 0-3.4l2.6-2.6a2.41 2.41 0 0 1 3.4 0Z"></path>
                <path d="m14.5 12.5 2-2"></path>
                <path d="m11.5 9.5 2-2"></path>
                <path d="m8.5 6.5 2-2"></path>
                <path d="m17.5 15.5 2-2"></path>
              </svg>
              {flightStats?.dist}nm
            </span>
            <span className="text-muted-foreground/30 text-xs">·</span>
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                className="lucide lucide-clock w-3 h-3 text-primary/70"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              {flightStats?.duration}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap mb-4">
            <a href="https://www.flightradar24.com/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                className="lucide lucide-external-link w-3 h-3"
              >
                <path d="M15 3h6v6"></path>
                <path d="M10 14 21 3"></path>
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              </svg>
              FlightRadar
            </a>
          </div>
          <div className="flex items-center justify-between">
            <button
              onClick={() => markAsDone(flight.id)}
              className="flex items-center gap-2 text-sm font-medium transition-all px-3 py-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/5"
            >
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
                className="lucide lucide-circle w-4 h-4"
              >
                <circle cx="12" cy="12" r="10" />
              </svg>
              {flight.done ? "Completato" : "Da fare"}
            </button>
            <div className="inline-flex items-center rounded-md border px-2.5 py-0.5 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80 text-xs">
              Pianificato
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      <div
        className={`fixed inset-0 z-1000 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 transition-opacity duration-200 ${
          modalOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={(e) => {
          if (e.target === e.currentTarget) setModalOpen(false);
        }}
      >
        <div className="flex min-w-5/12 w-fit max-h-[90vh] rounded-2xl border border-white/8 bg-background shadow-2xl overflow-hidden">
          {/* Sinistra — dettagli */}
          <div className="w-full shrink-0 flex flex-col overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 pb-4 sticky top-0 z-10">
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
                <div className="rounded-xl border bg-background border-input px-3 py-3  shadow-sm flex justify-between items-center text-xs">
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
                <div className="rounded-xl border bg-background border-input px-3 py-3 flex flex-col gap-2 shadow-sm">
                  {airline && <Row label="Compagnia" value={`${airline.name} · ${airline.country}`} className="text-white/80" />}
                  {flight.aircraft && <Row label="Tipo aereo" value={flight.aircraft} />}
                  {flight.tailNumber && <Row label="Numero di coda" value={flight.tailNumber} className="text-white/80 font-mono" onCopy={() => navigator.clipboard.writeText(flight.tailNumber!)} />}
                  {flight.flightNumber && (
                    <Row label="Numero volo" value={flight.flightNumber} className="text-blue-400 font-mono" onCopy={() => navigator.clipboard.writeText(flight.flightNumber!)} />
                  )}
                  {flight.notes && <Row label="Note" value={flight.notes} />}
                  <Row label="Stato" value={flight.done ? "✓ Completato" : "⏳ Da fare"} valueClass={flight.done ? "text-green-500" : "text-yellow-500"} />
                  <Row label="Aggiunto il" value={new Date(flight.createdAt).toLocaleDateString("it-IT", { day: "2-digit", month: "short", year: "numeric" })} />
                </div>
              </div>

              {/* Azioni */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setModalOpen(false)}
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent h-9 px-4 py-2 flex-1"
                >
                  Annulla
                </button>
                <button
                  onClick={() => {
                    // TODO: updateFlight(flight.id, formData)
                    setModalOpen(false);
                  }}
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2 flex-1"
                >
                  Aggiorna
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
