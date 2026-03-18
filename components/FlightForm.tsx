"use client";

import { useRef, useState } from "react";
import { addFlight } from "@/lib/actions";
import AirportInput, { type AirportInfo } from "./AirportInput";
import AircraftInput from "./AircraftInput";

const inputClass =
  "flex h-9 w-full border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm rounded-xl";
const labelClass = "text-xs text-muted-foreground mb-1.5 block font-medium";

export type RouteCoords = {
  depLat: number;
  depLon: number;
  arrLat: number;
  arrLon: number;
  depName: string;
  arrName: string;
} | null;

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

function AirportCard({ info }: { info: AirportInfo }) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
      <div className="col-span-2 text-white font-medium truncate">{info.name}</div>
      <div className="text-white/40">Stato</div>
      <div className="text-white/70 text-right">{info.country}</div>
      <div className="text-white/40">Altitudine</div>
      <div className="text-white/70 text-right">{info.elevation ? `${Math.round(info.elevation)} ft` : "—"}</div>
    </div>
  );
}

export default function FlightForm({ onSuccess, onRouteChange }: { onSuccess?: () => void; onRouteChange?: (route: RouteCoords) => void }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [depInfo, setDepInfo] = useState<AirportInfo | null>(null);
  const [arrInfo, setArrInfo] = useState<AirportInfo | null>(null);
  const [cruiseSpeed, setCruiseSpeed] = useState<number>(450);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [airline, setAirline] = useState<{ name: string; country: string } | null>(null);
  const airlineTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleFlightNumberChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value.toUpperCase();
    setAirline(null);
    if (airlineTimeoutRef.current) clearTimeout(airlineTimeoutRef.current);
    if (val.length >= 3) {
      airlineTimeoutRef.current = setTimeout(async () => {
        const res = await fetch(`/api/airline?flight=${val}`);
        const data = await res.json();
        setAirline(data);
      }, 600);
    }
  }

  function handleDepResolved(info: AirportInfo | null) {
    setDepInfo(info);
    if (info && arrInfo) {
      onRouteChange?.({ depLat: info.lat, depLon: info.lon, arrLat: arrInfo.lat, arrLon: arrInfo.lon, depName: info.name, arrName: arrInfo.name });
    } else {
      onRouteChange?.(null);
    }
  }

  function handleArrResolved(info: AirportInfo | null) {
    setArrInfo(info);
    if (depInfo && info) {
      onRouteChange?.({ depLat: depInfo.lat, depLon: depInfo.lon, arrLat: info.lat, arrLon: info.lon, depName: depInfo.name, arrName: info.name });
    } else {
      onRouteChange?.(null);
    }
  }

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true);
    await addFlight(formData);
    formRef.current?.reset();
    setDepInfo(null);
    setArrInfo(null);
    onRouteChange?.(null);
    setIsSubmitting(false);
    onSuccess?.();
  }

  const flightStats =
    depInfo && arrInfo
      ? (() => {
          const dist = haversineNm(depInfo.lat, depInfo.lon, arrInfo.lat, arrInfo.lon);
          const time = dist / cruiseSpeed;
          return { dist: Math.round(dist), duration: formatDuration(time) };
        })()
      : null;

  return (
    <form ref={formRef} action={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        {/* DEPARTURE */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-white/50 uppercase tracking-wider">Departure</p>
          <div>
            <label className={labelClass}>ICAO / IATA</label>
            <AirportInput name="departure" onResolved={handleDepResolved} />
          </div>
          {depInfo && <AirportCard info={depInfo} />}
        </div>

        {/* ARRIVAL */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-white/50 uppercase tracking-wider">Arrival</p>
          <div>
            <label className={labelClass}>ICAO / IATA</label>
            <AirportInput name="arrival" onResolved={handleArrResolved} />
          </div>
          {arrInfo && <AirportCard info={arrInfo} />}
        </div>
      </div>

      {/* STIMA VOLO */}
      {flightStats && (
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 flex justify-between items-center text-xs">
          <div className="flex flex-col gap-0.5">
            <span className="text-white/40">Distanza</span>
            <span className="text-white font-medium">{flightStats.dist} NM</span>
          </div>
          <div className="w-px h-8 bg-white/[0.08]" />
          <div className="flex flex-col gap-0.5 items-center">
            <span className="text-white/40">Velocità crociera</span>
            <span className="text-white font-medium">{cruiseSpeed} kts</span>
          </div>
          <div className="w-px h-8 bg-white/[0.08]" />
          <div className="flex flex-col gap-0.5 items-end">
            <span className="text-white/40">Tempo stimato</span>
            <span className="text-blue-400 font-semibold">{flightStats.duration}</span>
          </div>
        </div>
      )}

      {/* FLIGHT DETAILS */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-white/50 uppercase tracking-wider">Flight Details</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Aircraft Type</label>
            <AircraftInput onSpeedChange={setCruiseSpeed} />
          </div>
          <div>
            <label className={labelClass}>Flight Number</label>
            <input name="flightNumber" placeholder="AZ1234" onChange={handleFlightNumberChange} className={`${inputClass} font-mono`} />
            {airline && (
              <p className="text-xs text-white/40 mt-1 px-1">
                ✈ <span className="text-white/70">{airline.name}</span> · {airline.country}
              </p>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>
              Tail Number <span className="text-white/20">(optional)</span>
            </label>
            <input name="tailNumber" placeholder="I-ABCD" className={`${inputClass} font-mono`} />
          </div>
          <div>
            <label className={labelClass}>
              FR24 Link <span className="text-white/20">(optional)</span>
            </label>
            <input name="flightradarUrl" type="url" placeholder="https://..." className={inputClass} />
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onSuccess}
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 flex-1"
        >
          Annulla
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2 flex-1"
        >
          {isSubmitting ? "Saving..." : "Crea volo"}
        </button>
      </div>
    </form>
  );
}
