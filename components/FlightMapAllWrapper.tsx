"use client";

import dynamic from "next/dynamic";
import type { Flight } from "@/db/schema";

const FlightMapAll = dynamic(() => import("./FlightMapAll"), { ssr: false });

export default function FlightMapAllWrapper({ flights }: { flights: Flight[] }) {
  return <FlightMapAll flights={flights} />;
}
