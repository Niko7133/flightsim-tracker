import { db } from "@/db";
import { flights } from "@/db/schema";
import { eq } from "drizzle-orm";
import FlightCard from "@/components/FlightCard";
import Link from "next/link";

export default async function DonePage() {
  const done = await db.select().from(flights).where(eq(flights.done, true));

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-6 w-full mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">✅ Voli completati</h1>
        <Link href="/" className="text-sm text-zinc-400 hover:text-white transition-colors">
          ← Da fare
        </Link>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-sm text-zinc-500 uppercase tracking-wider font-medium">Completati · {done.length}</h2>
        {done.length === 0 && <p className="text-zinc-600 text-sm">Nessun volo completato ancora.</p>}
        {done.map((flight) => (
          <FlightCard key={flight.id} flight={flight} />
        ))}
      </div>
    </main>
  );
}
