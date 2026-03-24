import type { Metadata } from "next";
import { db } from "@/db";
import { flights } from "@/db/schema";
import HomeHeader from "@/components/HomeHeader";

export const metadata: Metadata = {
  title: "Flight Sim Tracker",
  description: "Traccia i tuoi voli sul simulatore",
};

export default async function Home() {
  const allFlights = await db.select().from(flights);
  return (
    <main>
      <HomeHeader flights={allFlights} />
    </main>
  );
}
