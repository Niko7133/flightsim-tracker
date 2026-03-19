"use client";

import { useState } from "react";
import { markAsDone, deleteFlight } from "@/lib/actions";
import type { Flight } from "@/db/schema";
import FlightModal, { RouteCoords } from "./modal/FlightModal";
import ConfirmDialog from "./ui/ConfirmDialog";

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

export default function FlightCard({ flight }: { flight: Flight }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [depInfo, setDepInfo] = useState<AirportInfo | null>(null);
  const [arrInfo, setArrInfo] = useState<AirportInfo | null>(null);
  const [loadingDep, setLoadingDep] = useState(false);
  const [loadingArr, setLoadingArr] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

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
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
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
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer disabled:pointer-events-none disabled:opacity-50 hover:bg-accent  h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                id="openModalFlight"
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
                  className="lucide lucide-pencil w-3.5 h-3.5"
                >
                  <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"></path>
                  <path d="m15 5 4 4"></path>
                </svg>
              </button>
              <button
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg]:size-4 [&amp;_svg]:shrink-0 hover:bg-accent h-7 w-7 opacity-0  cursor-pointer group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                onClick={() => setConfirmOpen(true)}
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

            <div className="bg-muted/60 rounded-lg px-3 py-2">
              <div className="text-xs text-muted-foreground mb-0.5">Distanza</div>
              <div className="text-sm font-medium text-foreground truncate">{flightStats?.dist}nm</div>
            </div>
            <div className="bg-muted/60 rounded-lg px-3 py-2">
              <div className="text-xs text-muted-foreground mb-0.5">Tempo stimato</div>
              <div className="text-sm font-medium text-foreground truncate">{flightStats?.duration}</div>
            </div>
          </div>
          {flight.flightradarUrl && (
            <div className="flex items-center gap-2 flex-wrap mb-4">
              <a href={flight.flightradarUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
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
                  className="lucide lucide-external-link w-3 h-3"
                >
                  <path d="M15 3h6v6"></path>
                  <path d="M10 14 21 3"></path>
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                </svg>
                FlightRadar
              </a>
            </div>
          )}
          <div className="flex items-center justify-between">
            <button
              onClick={() => markAsDone(flight.id, !flight.done)}
              className="flex items-center cursor-pointer gap-2 text-sm font-medium transition-all px-3 py-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/5"
            >
              {flight.done ? (
                <>
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
                    className="text-green-500"
                  >
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <path d="M22 4 12 14.01l-3-3" />
                  </svg>
                  <span className="text-green-500">Completato</span>
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                  </svg>
                  Da fare
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <FlightModal open={modalOpen} onClose={() => setModalOpen(false)} flight={flight} />

      <ConfirmDialog
        open={confirmOpen}
        title="Elimina volo"
        description={`Vuoi eliminare il volo ${flight.departure} → ${flight.arrival}?`}
        confirmLabel="Elimina"
        onConfirm={() => {
          deleteFlight(flight.id);
          setConfirmOpen(false);
        }}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}
