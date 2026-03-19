"use client";

import { useState, useEffect } from "react";
import FlightCard from "./FlightCard";
import type { Flight } from "@/db/schema";
import FlightModal from "./modal/FlightModal";
import type { RouteCoords } from "./modal/FlightModal";

type TabFilter = "all" | "pending" | "done";

export default function FlightListSearch({ flights, externalModalOpen, onExternalModalClose }: { flights: Flight[]; externalModalOpen?: boolean; onExternalModalClose?: () => void }) {
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [grid, setGrid] = useState(false);
  const [tab, setTab] = useState<TabFilter>("all");

  useEffect(() => {
    if (externalModalOpen) setModalOpen(true);
  }, [externalModalOpen]);

  function closeModal() {
    setModalOpen(false);
    onExternalModalClose?.();
  }

  const filtered = flights.filter((f) => {
    const q = query.toLowerCase();
    const matchesQuery = f.departure.toLowerCase().includes(q) || f.arrival.toLowerCase().includes(q) || f.aircraft?.toLowerCase().includes(q);
    const matchesTab = tab === "all" || (tab === "pending" && !f.done) || (tab === "done" && f.done);
    return matchesQuery && matchesTab;
  });

  const tabClass = (t: TabFilter) =>
    `inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-pointer ${
      tab === t ? "bg-background text-foreground shadow" : "text-muted-foreground hover:text-foreground"
    }`;

  return (
    <>
      <div className="flex-1 min-w-0 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
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
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              className="flex h-9 w-full border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm pl-10 rounded-xl"
              placeholder="Cerca voli..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div role="tablist" className="inline-flex h-9 items-center justify-center bg-muted p-1 text-muted-foreground rounded-xl" style={{ outline: "none" }}>
            <button type="button" role="tab" onClick={() => setTab("all")} aria-selected={tab === "all"} className={tabClass("all")}>
              Tutti
            </button>
            <button type="button" role="tab" onClick={() => setTab("pending")} aria-selected={tab === "pending"} className={tabClass("pending")}>
              Da fare
            </button>
            <button type="button" role="tab" onClick={() => setTab("done")} aria-selected={tab === "done"} className={tabClass("done")}>
              Completati
            </button>
          </div>
        </div>

        <p className="text-sm text-zinc-500 uppercase tracking-wider font-medium">
          {tab === "all" ? "Tutti" : tab === "pending" ? "Da fare" : "Completati"} · {filtered.length}
        </p>

        {filtered.length === 0 && <p className="text-zinc-600 text-sm">Nessun volo trovato.</p>}

        <div className={grid ? "grid grid-cols-2 gap-3" : "flex flex-col gap-3"}>
          {filtered.map((flight) => (
            <FlightCard key={flight.id} flight={flight} />
          ))}
        </div>
      </div>

      <FlightModal open={modalOpen} onClose={closeModal} />
    </>
  );
}
