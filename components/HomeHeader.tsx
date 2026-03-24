"use client";

import { useState } from "react";
import FlightMapAllWrapper from "./FlightMapAllWrapper";
import FlightModal from "./modal/FlightModal";
import FlightListSearch from "./FlightListSearch";
import type { Flight } from "@/db/schema";
import { LuGitBranchPlus, LuLayoutList, LuMap, LuSettings } from "react-icons/lu";

export default function HomeHeader({ flights }: { flights: Flight[] }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [view, setView] = useState<"map" | "list">("map");

  return (
    <>
      <div className="flex h-screen bg-background text-white overflow-hidden relative">
        {/* Mappa */}
        <div className={`absolute inset-0 transition-opacity duration-300 ${view === "map" ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}>
          <FlightMapAllWrapper flights={flights} />
        </div>

        {/* Lista fullscreen */}
        <div className={`absolute inset-0 overflow-y-auto bg-background transition-opacity duration-300 ${view === "list" ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}>
          <div className="max-w-3xl mx-auto px-6 py-24">
            <FlightListSearch flights={flights} />
          </div>
        </div>

        {/* Dock bottom */}
        <div className="absolute z-10 bottom-4 left-0 right-0 mx-auto bg-black/60 w-fit flex flex-row gap-4 backdrop-blur-md border border-white/10 rounded-xl px-4 py-3">
          <div className="w-6 h-6 icons cursor-pointer" onClick={() => setModalOpen(true)}>
            <LuGitBranchPlus />
          </div>
          <div className="w-6 h-6 icons cursor-pointer" onClick={() => setView((v) => (v === "map" ? "list" : "map"))}>
            {view === "map" ? <LuLayoutList /> : <LuMap />}
          </div>
          <div className="w-6 h-6 icons cursor-pointer">
            <LuSettings />
          </div>
        </div>
      </div>

      <FlightModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
