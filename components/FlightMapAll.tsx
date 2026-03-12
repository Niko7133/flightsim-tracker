"use client";

import { useEffect, Fragment } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Flight } from "@/db/schema";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png"
});

function Routes({ flights }: { flights: Flight[] }) {
  const map = useMap();

  useEffect(() => {
    const layers: L.Polyline[] = [];

    flights.forEach((f) => {
      if (!f.departureLat || !f.departureLon || !f.arrivalLat || !f.arrivalLon) return;
      const line = L.polyline(
        [
          [f.departureLat, f.departureLon],
          [f.arrivalLat, f.arrivalLon]
        ],
        { color: "#3b82f6", weight: 2, dashArray: "8, 8" }
      ).addTo(map);
      layers.push(line);
    });

    return () => {
      layers.forEach((l) => map.removeLayer(l));
    };
  }, [map, flights]);

  return null;
}

export default function FlightMapAll({ flights }: { flights: Flight[] }) {
  const withCoords = flights.filter((f) => f.departureLat && f.arrivalLat);

  return (
    <MapContainer center={[20, 10]} zoom={2} style={{ height: "100%", width: "100%" }} scrollWheelZoom={true}>
      <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution='&copy; <a href="https://carto.com/">CARTO</a>' />
      <Routes flights={withCoords} />
      {withCoords.map((f) => (
        <Fragment key={f.id}>
          <Marker position={[f.departureLat!, f.departureLon!]}>
            <Popup>{f.departure}</Popup>
          </Marker>
          <Marker position={[f.arrivalLat!, f.arrivalLon!]}>
            <Popup>{f.arrival}</Popup>
          </Marker>
        </Fragment>
      ))}
    </MapContainer>
  );
}
