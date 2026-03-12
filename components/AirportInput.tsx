"use client";

import { useState, useRef } from "react";

export type AirportInfo = {
  icao: string;
  name: string;
  municipality: string;
  country: string;
  elevation: number;
  localTime: string | null;
  lat: number;
  lon: number;
  weather?: { temperature_2m: number; weather_code: number };
};

const inputClass =
  "flex w-full border px-3 py-1 text-sm bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 rounded-xl h-11 focus:border-white/20 focus:outline-none focus:ring-0 transition-colors";

export default function AirportInput({ name, onResolved }: { name: string; onResolved?: (info: AirportInfo | null) => void }) {
  const [value, setValue] = useState("");
  const [info, setInfo] = useState<AirportInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function fetchAirport(code: string) {
    if (code.length < 3) {
      setInfo(null);
      onResolved?.(null);
      return;
    }
    setLoading(true);
    const res = await fetch(`/api/airport?icao=${code}`);
    const data = await res.json();
    if (data) {
      setInfo(data);
      onResolved?.(data);
      if (code.length === 3 && data.icao) setValue(data.icao);
    } else {
      setInfo(null);
      onResolved?.(null);
    }
    setLoading(false);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value.toUpperCase();
    setValue(val);
    setInfo(null);
    onResolved?.(null);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => fetchAirport(val), 600);
  }

  return (
    <>
      <input name={name} value={value} onChange={handleChange} placeholder="LIPE" required maxLength={4} className={`${inputClass} uppercase font-mono`} />
      <input type="hidden" name={`${name}Lat`} value={info?.lat ?? ""} />
      <input type="hidden" name={`${name}Lon`} value={info?.lon ?? ""} />
      <input type="hidden" name={`${name}Name`} value={info?.name ?? ""} />
      {loading && <p className="text-xs text-white/30 mt-1">Ricerca...</p>}
    </>
  );
}
