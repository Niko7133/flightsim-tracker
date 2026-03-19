"use client";

import { Fragment } from "react";
import { Map, MapMarker, MarkerContent, MarkerTooltip, MapRoute } from "@/components/ui/map";
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

export default function FlightMapAll({ flights }: { flights: Flight[] }) {
  const withCoords = flights.filter((f) => f.departureLat && f.arrivalLat);
  const pending = withCoords.filter((f) => !f.done);
  const done = withCoords.filter((f) => f.done);

  return (
    <div className="relative h-full w-full">
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
              color={f.done ? "#7c3bed" : "#7c3bed"}
              width={f.done ? 2 : 2}
              opacity={f.done ? 0.9 : 0.9}
              dashArray={f.done ? [6, 6] : undefined}
            />
          </Fragment>
        ))}
      </Map>

      {/* Legenda */}
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
