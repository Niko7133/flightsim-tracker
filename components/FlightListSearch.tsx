"use client";

import { useState } from "react";
import FlightCard from "./FlightCard";
import FlightForm from "./FlightForm";
import RouteMapPreviewWrapper from "./RouteMapPreviewWrapper";
import type { RouteCoords } from "./FlightForm";
import type { Flight } from "@/db/schema";

export default function FlightListSearch({ flights }: { flights: Flight[] }) {
  const [route, setRoute] = useState<RouteCoords>(null);
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [grid, setGrid] = useState(false);

  const filtered = flights.filter((f) => {
    const q = query.toLowerCase();
    return f.departure.toLowerCase().includes(q) || f.arrival.toLowerCase().includes(q) || f.aircraft?.toLowerCase().includes(q);
  });

  return (
    <>
      {/* Search + Add */}
      <div className="flex gap-2 mb-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 bg-zinc-800 text-white placeholder-zinc-500 px-4 py-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          placeholder="Cerca per ICAO o aereo..."
        />
        <button
          onClick={() => setModalOpen(true)}
          className="bg-blue-600/40 border border-blue-600  hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap cursor-pointer"
        >
          + Nuovo volo
        </button>
      </div>

      {/* Contatore + toggle */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-zinc-500 uppercase tracking-wider font-medium">Da fare · {filtered.length}</p>
        {/* <div className="flex gap-1 bg-zinc-800 p-1 rounded-lg">
          <button onClick={() => setGrid(false)} className={`cursor-pointer px-2 py-1 rounded-md text-sm transition-colors ${!grid ? "bg-zinc-600 text-white" : "text-zinc-500 hover:text-white"}`}>
            ☰
          </button>
          <button onClick={() => setGrid(true)} className={`cursor-pointer px-2 py-1 rounded-md text-sm transition-colors ${grid ? "bg-zinc-600 text-white" : "text-zinc-500 hover:text-white"}`}>
            ⊞
          </button>
        </div> */}
      </div>

      {filtered.length === 0 && <p className="text-zinc-600 text-sm">Nessun volo trovato.</p>}

      {/* Lista o griglia */}
      <div className={grid ? "grid grid-cols-2 gap-3" : "flex flex-col gap-3"}>
        {filtered.map((flight) => (
          <FlightCard key={flight.id} flight={flight} />
        ))}
      </div>

      {/* Modal — sempre nel DOM, nascosto con CSS */}
      <div
        className={`fixed inset-0 z-1000 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 transition-opacity duration-200 ${
          modalOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={(e) => {
          if (e.target === e.currentTarget) setModalOpen(false);
        }}
      >
        <div className="flex w-10/12 max-h-[90vh] rounded-3xl border border-white/8 bg-[#1A1A24] shadow-2xl overflow-hidden">
          {/* Form — sinistra */}
          <div className="w-7/12 shrink-0 flex flex-col overflow-y-auto">
            <div className="flex items-center justify-between p-6 pb-4 sticky top-0 bg-[#1A1A24] z-10">
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
                  <h2 className="text-lg font-semibold text-white">New Flight</h2>
                  <p className="text-xs text-white/40">Plan your next route</p>
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
            <div className="px-6 pb-6">
              <FlightForm onSuccess={() => setModalOpen(false)} onRouteChange={setRoute} />
            </div>
          </div>

          {/* Mappa — destra */}
          <div className="flex-1 border-l border-white/[0.06]">
            <RouteMapPreviewWrapper route={route} />
          </div>
        </div>
      </div>
    </>
  );
}
