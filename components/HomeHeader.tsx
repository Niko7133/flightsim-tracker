"use client";

import { useState } from "react";
import FlightMapAllWrapper from "./FlightMapAllWrapper";
import FlightModal from "./modal/FlightModal";
import FlightListSearch from "./FlightListSearch";
import type { Flight } from "@/db/schema";
import Dock from "./ui/Dock";

export default function HomeHeader({ flights }: { flights: Flight[] }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [view, setView] = useState<"map" | "list">("map");
  const [highlightedFlightId, setHighlightedFlightId] = useState<number | null>(null);

  function handleFocusFlight(id: number) {
    setHighlightedFlightId(id);
    setView("list");
  }

  return (
    <>
      <div className="flex h-screen bg-background text-white overflow-hidden relative">
        <div className={`absolute inset-0 transition-opacity duration-300 ${view === "map" ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}>
          <FlightMapAllWrapper flights={flights} onFocusFlight={handleFocusFlight} />
        </div>

        <div className={`absolute inset-0 overflow-y-auto bg-background transition-opacity duration-300 ${view === "list" ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}>
          <div className="w-full px-body pb-24 pt-body">
            <FlightListSearch flights={flights} highlightedFlightId={highlightedFlightId} onClearHighlight={() => setHighlightedFlightId(null)} />
          </div>
        </div>

        <Dock onAddFlight={() => setModalOpen(true)} onToggleView={() => setView((v) => (v === "map" ? "list" : "map"))} view={view} />
      </div>

      <FlightModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
