import { db } from "@/db";
import { flights } from "@/db/schema";
import { eq } from "drizzle-orm";
import FlightMapAllWrapper from "@/components/FlightMapAllWrapper";
import FlightListSearch from "@/components/FlightListSearch";
import Link from "next/link";

export default async function Home() {
  const pending = await db.select().from(flights).where(eq(flights.done, false));

  return (
    <div className="flex h-screen bg-zinc-950 text-white overflow-hidden">
      {/* Sidebar sinistra */}
      <div className="w-2/4 shrink-0 flex flex-col h-full border-r border-zinc-800">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <h1 className="text-lg font-bold">✈️ Flight Sim Tracker</h1>
          <Link href="/done" className="text-xs text-zinc-400 hover:text-white transition-colors">
            Completati →
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <FlightListSearch flights={pending} />
        </div>
      </div>

      {/* Mappa destra */}
      <div className="w-2/4 flex-1 h-full px-6 py-4">
        <div className="rounded-3xl overflow-hidden w-full h-full border border-zinc-800">
          <FlightMapAllWrapper flights={pending} />
        </div>
      </div>
    </div>
  );
}
