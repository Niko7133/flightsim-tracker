"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { markAsDone, deleteFlight } from "@/lib/actions";
import type { Flight } from "@/db/schema";
import FlightModal from "./modal/FlightModal";
import ConfirmDialog from "./ui/ConfirmDialog";
import { LuPencil, LuX, LuPlaneTakeoff, LuPlaneLanding, LuCheck, LuAntenna } from "react-icons/lu";

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

export default function FlightCard({
  flight,
  selecting = false,
  selected = false,
  onSelect,
  highlighted = false,
}: {
  flight: Flight;
  selecting?: boolean;
  selected?: boolean;
  onSelect?: (id: number) => void;
  highlighted?: boolean;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [hovered, setHovered] = useState(false);

  const route =
    flight.departureLat && flight.departureLon && flight.arrivalLat && flight.arrivalLon
      ? { depLat: flight.departureLat, depLon: flight.departureLon, arrLat: flight.arrivalLat, arrLon: flight.arrivalLon }
      : null;

  const flightStats = route
    ? (() => {
        const dist = haversineNm(route.depLat, route.depLon, route.arrLat, route.arrLon);
        return { dist: Math.round(dist), duration: formatDuration(dist / 450) };
      })()
    : null;

  return (
    <>
      {/* ── MOBILE ── */}
      <div
        onClick={() => selecting && onSelect?.(flight.id)}
        className={`md:hidden flex flex-col bg-card border-b border-border last:border-b-0 transition-colors duration-150
          ${selecting ? "cursor-pointer" : ""}
          ${selected ? "bg-destructive/10" : ""}
          ${highlighted ? "ring-2 ring-inset ring-primary" : ""}
        `}
      >
        {/* Top row: icon + airline + actions */}
        <div className="flex items-center justify-between px-4 pt-3 pb-2">
          <div className="flex items-center gap-2">
            {flight.done ? <LuPlaneLanding className="w-4 h-4 text-green-500 shrink-0" /> : <LuPlaneTakeoff className="w-4 h-4 text-muted-foreground shrink-0" />}
            <span className="text-sm truncate max-w-[140px]">{flight.airline ?? "—"}</span>
            {flight.flightNumber && <span className="text-xs text-muted-foreground font-mono">{flight.flightNumber}</span>}
          </div>
          {!selecting && (
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  markAsDone(flight.id, !flight.done);
                }}
                className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-accent transition-colors cursor-pointer"
              >
                <LuCheck className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setModalOpen(true);
                }}
                className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-accent transition-colors cursor-pointer"
              >
                <LuPencil className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirmOpen(true);
                }}
                className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-accent text-destructive transition-colors cursor-pointer"
              >
                <LuX className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Route */}
        <div className="flex items-center gap-3 px-4 pb-3">
          <div className="text-center shrink-0">
            <div className="text-lg font-bold tracking-wide">{flight.departure}</div>
          </div>

          <div className="flex-1 flex flex-col items-center">
            <div className="relative w-full flex items-center">
              <div className="flex-1 border-b border-dashed border-border" />
              <div className="mx-2 flex flex-col items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-muted-foreground"
                >
                  <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
                </svg>
                {flightStats && <span className="text-xs text-muted-foreground mt-0.5">{flightStats.duration}</span>}
              </div>
              <div className="flex-1 border-b border-dashed border-border" />
            </div>
          </div>

          <div className="text-center shrink-0">
            <div className="text-lg font-bold tracking-wide">{flight.arrival}</div>
          </div>
        </div>

        {/* Bottom row: aircraft + tail + distance */}
        {(flight.aircraft || flight.tailNumber || flightStats) && (
          <div className="flex items-center gap-3 px-4 pb-3 text-xs text-muted-foreground">
            {flight.aircraft && <span>{flight.aircraft}</span>}
            {flight.tailNumber && <span className="uppercase">{flight.tailNumber}</span>}
            {flightStats && <span className="ml-auto">{flightStats.dist} nm</span>}
          </div>
        )}
      </div>

      {/* ── DESKTOP ── */}
      <div
        onClick={() => selecting && onSelect?.(flight.id)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={`hidden md:flex items-center justify-between gap-0 bg-card border-b border-border last:border-b-0 transition-colors duration-150
          ${selecting ? "cursor-pointer" : "hover:bg-accent/30"}
          ${selected ? "bg-destructive/10 border-destructive" : ""}
          ${highlighted ? "ring-2 ring-inset ring-primary" : ""}
        `}
      >
        <div className="flex flex-row items-center">
          <div className="shrink-0 w-12 flex items-center justify-center py-4 pl-3">
            {flight.done ? <LuPlaneLanding className="w-4 h-4 text-green-500" /> : <LuPlaneTakeoff className="w-4 h-4 text-muted-foreground" />}
          </div>
          <div className="w-px h-8 bg-border shrink-0" />
          <div className="shrink-0 min-w-60 px-4 text-sm truncate">{flight.airline ?? "—"}</div>
          <div className="w-px h-8 bg-border shrink-0" />
          <div className="shrink-0 min-w-60 px-4 text-center text-sm text-muted-foreground truncate">{flight.aircraft ?? "—"}</div>
          <div className="w-px h-8 bg-border shrink-0" />
          <div className="shrink-0 w-30 px-4 text-center text-sm text-muted-foreground truncate uppercase">{flight.tailNumber ?? "—"}</div>
          <div className="w-px h-8 bg-border shrink-0" />
        </div>

        <div className="flex-1 px-8 flex items-center gap-3 w-1/2">
          <div className="text-center shrink-0">
            <div className="text-base font-bold tracking-wide">{flight.departure}</div>
          </div>
          <div className="flex-1 flex flex-col items-center gap-0.5">
            <div className="relative w-full flex items-center">
              <div className="flex-1 border-b border-dashed border-border" />
              <div className="mx-3 flex flex-col items-center">
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
                  className="text-muted-foreground"
                >
                  <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
                </svg>
                {flightStats && <span className="text-xs text-muted-foreground mt-0.5">{flightStats.duration}</span>}
              </div>
              <div className="flex-1 border-b border-dashed border-border" />
            </div>
          </div>
          <div className="text-center shrink-0">
            <div className="text-base font-bold tracking-wide">{flight.arrival}</div>
          </div>
        </div>

        {!selecting && (
          <motion.div animate={{ width: hovered ? "auto" : 0, opacity: hovered ? 1 : 0 }} transition={{ duration: 0.2 }} className="flex items-center gap-1 pr-3 overflow-hidden shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                markAsDone(flight.id, !flight.done);
              }}
              className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-accent transition-colors cursor-pointer"
            >
              <LuCheck className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setModalOpen(true);
              }}
              className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-accent transition-colors cursor-pointer"
            >
              <LuPencil className="w-3.5 h-3.5" />
            </button>
            {flight.flightradarUrl && (
              <a href={flight.flightradarUrl} className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-accent transition-colors cursor-pointer">
                <LuAntenna className="w-3.5 h-3.5" />
              </a>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setConfirmOpen(true);
              }}
              className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-accent text-destructive transition-colors cursor-pointer"
            >
              <LuX className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
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
