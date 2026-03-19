"use client";

import { useState, useRef } from "react";

type Aircraft = {
  manufacturer: string;
  model: string;
  engine_type: string;
  max_speed_knots: number;
  range_nautical_miles: number;
};

const inputClass =
  "flex h-9 w-full border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm rounded-xl";

export default function AircraftInput({ onSpeedChange, defaultValue }: { onSpeedChange?: (speed: number) => void; defaultValue?: string }) {
  const [value, setValue] = useState(defaultValue ?? "");
  const [results, setResults] = useState<Aircraft[]>([]);
  const [selected, setSelected] = useState<Aircraft | null>(null);
  const [loading, setLoading] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function search(q: string) {
    if (q.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    const res = await fetch(`/api/aircraft?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    setResults(data);
    setLoading(false);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setValue(val);
    setSelected(null);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => search(val), 500);
  }

  function handleSelect(a: Aircraft) {
    const label = `${a.manufacturer} ${a.model}`;
    setValue(label);
    setSelected(a);
    setResults([]);
    if (a.max_speed_knots) {
      onSpeedChange?.(Math.round(a.max_speed_knots * 0.85));
    }
  }

  return (
    <div className="flex flex-col gap-1 relative">
      <input name="aircraft" value={value} onChange={handleChange} placeholder="Boeing 737-800" autoComplete="off" className={inputClass} />
      {(loading || results.length > 0) && (
        <div className="absolute top-full left-0 right-0 z-20 bg-zinc-800 border border-zinc-700 rounded-lg mt-1 overflow-hidden shadow-xl">
          {loading && <p className="text-xs text-zinc-500 px-4 py-2">Ricerca...</p>}
          {results.map((a, i) => (
            <button key={i} type="button" onClick={() => handleSelect(a)} className="w-full text-left px-4 py-2 hover:bg-zinc-700 transition-colors flex justify-between items-center gap-2">
              <span className="text-white text-sm">
                {a.manufacturer} {a.model}
              </span>
              <span className="text-zinc-500 text-xs shrink-0">{a.engine_type}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
