"use client";

import { Fragment, useState, useRef } from "react";
import { Map, MapMarker, MarkerContent, MarkerTooltip, MapRoute } from "@/components/ui/map";
import { LuFocus } from "react-icons/lu";
import type { Flight } from "@/db/schema";

function getCurvedCoordinates(lon1: number, lat1: number, lon2: number, lat2: number, steps = 50): [number, number][] {
  const points: [number, number][] = [];
  const midLon = (lon1 + lon2) / 2;
  const midLat = (lat1 + lat2) / 2;
  const dist = Math.sqrt((lon2 - lon1) ** 2 + (lat2 - lat1) ** 2);
  const curvature = dist * 0.2;
  const dx = lon2 - lon1;
  const dy = lat2 - lat1;
  const len = Math.sqrt(dx * dx + dy * dy);
  const perpLon = midLon + (-dy / len) * curvature;
  const perpLat = midLat + (dx / len) * curvature;

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const lon = (1 - t) ** 2 * lon1 + 2 * (1 - t) * t * perpLon + t ** 2 * lon2;
    const lat = (1 - t) ** 2 * lat1 + 2 * (1 - t) * t * perpLat + t ** 2 * lat2;
    points.push([lon, lat]);
  }
  return points;
}

function haversineNm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3440.065;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function RoutePopup({ flight, x, y, onClose, onFocus }: { flight: Flight; x: number; y: number; onClose: () => void; onFocus: () => void }) {
  const dist =
    flight.departureLat && flight.departureLon && flight.arrivalLat && flight.arrivalLon
      ? Math.round(haversineNm(flight.departureLat, flight.departureLon, flight.arrivalLat, flight.arrivalLon))
      : null;

  return (
    <div className="fixed z-50" style={{ left: x + 16, top: y - 8 }}>
      <div className="bg-card border border-border rounded-xl shadow-xl min-w-[220px] overflow-hidden text-sm">
        <div className="flex items-start justify-between px-3 pt-3 pb-2">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground font-thin mb-1">Route</span>
            <div className="flex items-center gap-2 text-base font-medium">
              <span>{flight.departure}</span>
              <span className="text-muted-foreground">→</span>
              <span>{flight.arrival}</span>
            </div>
            {flight.airline && <span className="text-xs text-muted-foreground mt-0.5">{flight.airline}</span>}
          </div>
          <div className="flex items-center gap-1 ml-3 mt-0.5 shrink-0">
            <button onClick={onFocus} className="text-muted-foreground p-1 rounded-md cursor-pointer hover:bg-accent hover:text-white transition-colors" title="Vai al volo">
              <LuFocus className="w-3.5 h-3.5" />
            </button>
            <button onClick={onClose} className="text-muted-foreground p-1 rounded-md cursor-pointer hover:bg-accent hover:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="h-px bg-border" />

        <div className="grid grid-cols-2 px-3 py-2 gap-2">
          {dist && (
            <div>
              <span className="font-semibold">{dist}</span>
              <span className="text-muted-foreground font-thin"> nm</span>
            </div>
          )}
          <div>
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${flight.done ? "bg-green-500/10 text-green-400" : "bg-primary/10 text-primary"}`}>
              {flight.done ? "Completato" : "Da fare"}
            </span>
          </div>
        </div>

        {(flight.aircraft || flight.tailNumber) && (
          <>
            <div className="h-px bg-border" />
            <div className="px-3 py-2 flex gap-3 text-xs text-muted-foreground">
              {flight.aircraft && <span>{flight.aircraft}</span>}
              {flight.tailNumber && <span className="uppercase">{flight.tailNumber}</span>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function FlightMapAll({ flights, onFocusFlight }: { flights: Flight[]; onFocusFlight?: (id: number) => void }) {
  const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const mousePos = useRef({ x: 0, y: 0 });

  const withCoords = flights.filter((f) => f.departureLat && f.arrivalLat);
  const pending = withCoords.filter((f) => !f.done);
  const done = withCoords.filter((f) => f.done);

  function handleRouteClick(f: Flight) {
    if (selectedFlight?.id === f.id) {
      setSelectedFlight(null);
    } else {
      setSelectedFlight(f);
      setPos(mousePos.current);
    }
  }

  return (
    <div
      className="relative h-full w-full"
      onMouseMove={(e) => {
        mousePos.current = { x: e.clientX, y: e.clientY };
      }}
    >
      <Map center={[10, 20]} zoom={2} className="h-full w-full" theme="dark">
        {withCoords.map((f) => (
          <Fragment key={f.id}>
            <MapMarker longitude={f.departureLon!} latitude={f.departureLat!}>
              <MarkerContent />
              <MarkerTooltip>{f.departure}</MarkerTooltip>
            </MapMarker>
            <MapMarker longitude={f.arrivalLon!} latitude={f.arrivalLat!}>
              <MarkerContent />
              <MarkerTooltip>{f.arrival}</MarkerTooltip>
            </MapMarker>
            <MapRoute
              coordinates={getCurvedCoordinates(f.departureLon!, f.departureLat!, f.arrivalLon!, f.arrivalLat!)}
              color="#7c3bed"
              width={selectedFlight?.id === f.id ? 4 : 2}
              opacity={selectedFlight?.id === f.id ? 1 : 0.9}
              dashArray={f.done ? [6, 6] : undefined}
              onClick={() => handleRouteClick(f)}
            />
          </Fragment>
        ))}
      </Map>

      {selectedFlight && (
        <RoutePopup
          flight={selectedFlight}
          x={pos.x}
          y={pos.y}
          onClose={() => setSelectedFlight(null)}
          onFocus={() => {
            onFocusFlight?.(selectedFlight.id);
            setSelectedFlight(null);
          }}
        />
      )}

      <div className="absolute bottom-4 left-4 z-10 bg-black/60 backdrop-blur-md border border-white/10 rounded-xl px-4 py-3 flex flex-col gap-2 text-xs text-white">
        <div className="flex items-center gap-2">
          <svg width="32" height="8">
            <line x1="0" y1="4" x2="32" y2="4" stroke="#7c3bed" strokeWidth="2" />
          </svg>
          <span className="text-white/70">Da fare ({pending.length})</span>
        </div>
        <div className="flex items-center gap-2">
          <svg width="32" height="8">
            <line x1="0" y1="4" x2="32" y2="4" stroke="#7c3bed" strokeWidth="1.5" strokeDasharray="4 4" />
          </svg>
          <span className="text-white/70">Completati ({done.length})</span>
        </div>
      </div>
    </div>
  );
}
