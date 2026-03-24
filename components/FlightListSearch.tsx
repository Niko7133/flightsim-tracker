"use client";

import { useState, useEffect } from "react";
import FlightCard from "./FlightCard";
import type { Flight } from "@/db/schema";
import FlightModal from "./modal/FlightModal";
import FlightEmpty from "./ui/FlightEmpty";

type TabFilter = "all" | "pending" | "done";

export default function FlightListSearch({
  flights,
  externalModalOpen,
  onExternalModalClose,
  highlightedFlightId,
  onClearHighlight,
}: {
  flights: Flight[];
  externalModalOpen?: boolean;
  onExternalModalClose?: () => void;
  highlightedFlightId?: number | null;
  onClearHighlight?: () => void;
}) {
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [tab, setTab] = useState<TabFilter>("all");
  const [selecting, setSelecting] = useState(false);
  const [selectedFlights, setSelectedFlights] = useState<number[]>([]);

  function toggleSelect(id: number) {
    setSelectedFlights((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]));
  }

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

  const pending = filtered.filter((f) => !f.done);
  const done = filtered.filter((f) => f.done);

  const tabClass = (t: TabFilter) =>
    `inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-pointer ${
      tab === t ? "bg-background text-foreground shadow" : "text-muted-foreground hover:text-foreground"
    }`;

  function renderCards(list: Flight[]) {
    return (
      <div className="rounded-xl border border-border overflow-hidden">
        {list.map((flight) => (
          <FlightCard key={flight.id} flight={flight} selecting={selecting} selected={selectedFlights.includes(flight.id)} onSelect={toggleSelect} highlighted={flight.id === highlightedFlightId} />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="flex-1 w-full flex flex-col gap-4">
        {/* Toolbar */}
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

        {/* Empty state */}
        {filtered.length === 0 && (
          <FlightEmpty
            hasFlights={flights.length > 0}
            hasFilters={query !== "" || tab !== "all"}
            onAddFlight={() => setModalOpen(true)}
            onShowAll={() => {
              setQuery("");
              setTab("all");
            }}
          />
        )}

        {/* Cards */}
        {filtered.length > 0 &&
          (tab === "all" ? (
            <div className="flex flex-col gap-6">
              {pending.length > 0 && (
                <div className="flex flex-col gap-2">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Da fare · {pending.length}</p>
                  {renderCards(pending)}
                </div>
              )}
              {done.length > 0 && (
                <div className="flex flex-col gap-2">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Completati · {done.length}</p>
                  {renderCards(done)}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                {tab === "pending" ? "Da fare" : "Completati"} · {filtered.length}
              </p>
              {renderCards(filtered)}
            </div>
          ))}
      </div>

      <FlightModal open={modalOpen} onClose={closeModal} />
    </>
  );
}
