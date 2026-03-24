"use client";

import dynamic from "next/dynamic";
import type { Flight } from "@/db/schema";

const FlightMapAll = dynamic(() => import("./FlightMapAll"), { ssr: false });

export default function FlightMapAllWrapper({ flights, onFocusFlight }: { flights: Flight[]; onFocusFlight?: (id: number) => void }) {
  return <FlightMapAll flights={flights} onFocusFlight={onFocusFlight} />;
}
