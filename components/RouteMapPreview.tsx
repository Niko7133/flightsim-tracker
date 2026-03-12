"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { RouteCoords } from "./FlightForm";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png"
});

function Route({ route }: { route: NonNullable<RouteCoords> }) {
  const map = useMap();
  useEffect(() => {
    const from: [number, number] = [route.depLat, route.depLon];
    const to: [number, number] = [route.arrLat, route.arrLon];
    const line = L.polyline([from, to], { color: "#3b82f6", weight: 2, dashArray: "8,8" }).addTo(map);
    map.fitBounds(L.latLngBounds([from, to]), { padding: [40, 40] });
    return () => {
      map.removeLayer(line);
    };
  }, [map, route]);
  return null;
}

export default function RouteMapPreview({ route }: { route: RouteCoords }) {
  if (!route) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-white/20 text-sm gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
        </svg>
        <p>
          Enter departure & arrival
          <br />
          to preview route
        </p>
      </div>
    );
  }

  return (
    <MapContainer center={[route.depLat, route.depLon]} zoom={5} style={{ height: "100%", width: "100%" }} scrollWheelZoom={false} zoomControl={false}>
      <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution="&copy; CARTO" />
      <Route route={route} />
      <Marker position={[route.depLat, route.depLon]}>
        <Popup>{route.depName}</Popup>
      </Marker>
      <Marker position={[route.arrLat, route.arrLon]}>
        <Popup>{route.arrName}</Popup>
      </Marker>
    </MapContainer>
  );
}
