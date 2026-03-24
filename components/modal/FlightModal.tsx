"use client";

import { useRef, useState, useEffect } from "react";
import AirportInput, { type AirportInfo } from "../ui/AirportInput";
import AircraftInput from "../ui/AircraftInput";
import Button from "../ui/button";
import type { Flight } from "@/db/schema";
import { addFlight, updateFlight } from "@/lib/actions";

const inputClass =
  "flex h-9 w-full border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors placeholder:text-muted-foreground text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm rounded-xl";
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

type Props = {
  open: boolean;
  onClose: () => void;
  onRouteChange?: (route: RouteCoords) => void;
  flight?: Flight;
};

export default function FlightModal({ open, onClose, onRouteChange, flight }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [depInfo, setDepInfo] = useState<AirportInfo | null>(null);
  const [arrInfo, setArrInfo] = useState<AirportInfo | null>(null);
  const [cruiseSpeed, setCruiseSpeed] = useState<number>(450);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<"volo" | "addons">("volo");
  const [depDefault, setDepDefault] = useState<string | undefined>(flight?.departure);
  const [arrDefault, setArrDefault] = useState<string | undefined>(flight?.arrival);
  const [airlineDefault, setAirlineDefault] = useState<string | undefined>(flight?.airline ?? undefined);
  const [airportInputKey, setAirportInputKey] = useState(0);
  const [formKey, setFormKey] = useState(0);
  const callSignTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setAirlineDefault(flight?.airline ?? undefined);
    setDepDefault(flight?.departure);
    setArrDefault(flight?.arrival);
  }, [flight]);

  useEffect(() => {
    if (open) setActiveTab("volo");
  }, [open]);

  function handleCallSignChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value.toUpperCase();
    if (callSignTimeoutRef.current) clearTimeout(callSignTimeoutRef.current);
    if (val.length >= 3) {
      callSignTimeoutRef.current = setTimeout(async () => {
        try {
          const res = await fetch(`https://api.adsbdb.com/v0/callsign/${val}`);
          const data = await res.json();
          const route = data?.response?.flightroute;
          if (route?.origin?.icao_code && route?.destination?.icao_code) {
            setDepDefault(route.origin.icao_code);
            setArrDefault(route.destination.icao_code);
            setAirlineDefault(route.airline?.name);
            setAirportInputKey((k) => k + 1);
          }
        } catch {
          // silenzioso
        }
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
    if (flight) {
      await updateFlight(flight.id, formData);
    } else {
      await addFlight(formData);
      setDepInfo(null);
      setArrInfo(null);
      setDepDefault(undefined);
      setArrDefault(undefined);
      setAirlineDefault(undefined);
      setAirportInputKey(0);
      setFormKey((k) => k + 1);
      onRouteChange?.(null);
    }
    setIsSubmitting(false);
    onClose();
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
    <div
      className={`fixed inset-0 z-1000 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 transition-opacity duration-200 ${
        open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div key={flight?.id ?? "new"} className="flex flex-col min-w-5/12 w-fit max-h-[90vh] rounded-2xl border border-white/8 bg-background shadow-2xl overflow-hidden p-6 gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">{flight ? `${flight.departure} → ${flight.arrival}` : "Nuovo volo"}</h2>
          <Button variant="close" size="icon" onClick={onClose}>
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
          </Button>
        </div>

        <form key={formKey} ref={formRef} action={handleSubmit} className="space-y-5">
          {/* Tabs */}
          <div className="inline-flex h-9 items-center justify-center bg-muted p-1 text-muted-foreground rounded-xl w-full">
            <button
              type="button"
              onClick={() => setActiveTab("volo")}
              className={`flex-1 inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium transition-all cursor-pointer ${activeTab === "volo" ? "bg-background text-foreground shadow" : "hover:text-foreground"}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
              </svg>
              Volo
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("addons")}
              className={`flex-1 inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium transition-all cursor-pointer ${activeTab === "addons" ? "bg-background text-foreground shadow" : "hover:text-foreground"}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" />
                <path d="M7 7h.01" />
              </svg>
              Addons
            </button>
          </div>

          {activeTab === "volo" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                {/* Callsign + Flight Number */}
                <div>
                  <label className={labelClass}>Callsign</label>
                  <input name="callSign" placeholder="EDW15KT" onChange={handleCallSignChange} className={`${inputClass} font-mono uppercase`} />
                </div>
                <div>
                  <label className={labelClass}>Flight Number</label>
                  <input name="flightNumber" placeholder="FR1234" defaultValue={flight?.flightNumber ?? ""} className={`${inputClass} font-mono uppercase`} />
                </div>

                {/* Departure */}
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-white/50 uppercase tracking-wider">Departure</p>
                  <div>
                    <label className={labelClass}>ICAO / IATA</label>
                    <AirportInput key={`dep-${airportInputKey}`} name="departure" onResolved={handleDepResolved} defaultValue={depDefault} />
                  </div>
                  {depInfo && <AirportCard info={depInfo} />}
                </div>

                {/* Arrival */}
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-white/50 uppercase tracking-wider">Arrival</p>
                  <div>
                    <label className={labelClass}>ICAO / IATA</label>
                    <AirportInput key={`arr-${airportInputKey}`} name="arrival" onResolved={handleArrResolved} defaultValue={arrDefault} />
                  </div>
                  {arrInfo && <AirportCard info={arrInfo} />}
                </div>
              </div>

              {/* Flight stats */}
              {flightStats && (
                <div className="rounded-xl border border-white/8 bg-white/3 px-4 py-3 flex justify-between items-center text-xs">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-white/40">Distanza</span>
                    <span className="text-white font-medium">{flightStats.dist} NM</span>
                  </div>
                  <div className="w-px h-8 bg-white/8" />
                  <div className="flex flex-col gap-0.5 items-center">
                    <span className="text-white/40">Velocità crociera</span>
                    <span className="text-white font-medium">{cruiseSpeed} kts</span>
                  </div>
                  <div className="w-px h-8 bg-white/8" />
                  <div className="flex flex-col gap-0.5 items-end">
                    <span className="text-white/40">Tempo stimato</span>
                    <span className="text-blue-400 font-semibold">{flightStats.duration}</span>
                  </div>
                </div>
              )}

              {/* Flight details */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-white/50 uppercase tracking-wider">Flight Details</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Aircraft Type</label>
                    <AircraftInput onSpeedChange={setCruiseSpeed} defaultValue={flight?.aircraft ?? undefined} />
                  </div>
                  <div>
                    <label className={labelClass}>Airline</label>
                    <input name="airline" placeholder="ITA Airways" value={airlineDefault ?? ""} onChange={(e) => setAirlineDefault(e.target.value)} className={inputClass} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>
                      Tail Number <span className="text-white/20">(optional)</span>
                    </label>
                    <input name="tailNumber" placeholder="I-ABCD" defaultValue={flight?.tailNumber ?? ""} className={`${inputClass} font-mono uppercase`} />
                  </div>
                  <div>
                    <label className={labelClass}>
                      FR24 Link <span className="text-white/20">(optional)</span>
                    </label>
                    <input name="flightradarUrl" type="url" placeholder="https://..." defaultValue={flight?.flightradarUrl ?? ""} className={inputClass} />
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === "addons" && (
            <div className="grid grid-cols-2 items-center justify-center py-12 text-white/20 text-sm gap-2">
              <div>
                <label className={labelClass}>Link scenario partenza{depInfo && <span className="text-white/30 ml-1">· {flight?.departure}</span>}</label>
                <input name="depScenarioUrl" type="url" placeholder="https://..." defaultValue={flight?.depScenarioUrl ?? ""} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Link scenario arrivo{arrInfo && <span className="text-white/30 ml-1">· {flight?.arrival}</span>}</label>
                <input name="arrScenarioUrl" type="url" placeholder="https://..." defaultValue={flight?.arrScenarioUrl ?? ""} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Link livrea</label>
                <input name="liveryUrl" type="url" placeholder="https://..." defaultValue={flight?.liveryUrl ?? ""} className={inputClass} />
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
              Annulla
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? "Saving..." : flight ? "Aggiorna volo" : "Crea volo"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
