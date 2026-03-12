"use client";

import dynamic from "next/dynamic";
import type { RouteCoords } from "./FlightForm";

const RouteMapPreview = dynamic(() => import("./RouteMapPreview"), { ssr: false });

export default function RouteMapPreviewWrapper({ route }: { route: RouteCoords }) {
  return <RouteMapPreview route={route} />;
}
