"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { flights } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function addFlight(formData: FormData) {
  const departure = formData.get("departure") as string;
  const arrival = formData.get("arrival") as string;
  const aircraft = formData.get("aircraft") as string;
  const tailNumber = formData.get("tailNumber") as string;
  const flightNumber = formData.get("flightNumber") as string;
  const flightradarUrl = formData.get("flightradarUrl") as string;
  const notes = formData.get("notes") as string;
  const departureLat = parseFloat(formData.get("departureLat") as string) || null;
  const departureLon = parseFloat(formData.get("departureLon") as string) || null;
  const arrivalLat = parseFloat(formData.get("arrivalLat") as string) || null;
  const arrivalLon = parseFloat(formData.get("arrivalLon") as string) || null;
  const depScenarioUrl = formData.get("depScenarioUrl") as string;
  const arrScenarioUrl = formData.get("arrScenarioUrl") as string;
  const liveryUrl = formData.get("liveryUrl") as string;

  await db.insert(flights).values({
    departure,
    arrival,
    aircraft,
    tailNumber,
    flightNumber,
    flightradarUrl,
    notes,
    departureLat,
    departureLon,
    arrivalLat,
    arrivalLon,
    depScenarioUrl,
    arrScenarioUrl,
    liveryUrl,
  });
  revalidatePath("/");
}

export async function updateFlight(id: number, formData: FormData) {
  const departure = formData.get("departure") as string;
  const arrival = formData.get("arrival") as string;
  const aircraft = formData.get("aircraft") as string;
  const tailNumber = formData.get("tailNumber") as string;
  const flightNumber = formData.get("flightNumber") as string;
  const flightradarUrl = formData.get("flightradarUrl") as string;
  const depScenarioUrl = formData.get("depScenarioUrl") as string;
  const arrScenarioUrl = formData.get("arrScenarioUrl") as string;
  const liveryUrl = formData.get("liveryUrl") as string;
  const notes = formData.get("notes") as string;
  const departureLat = parseFloat(formData.get("departureLat") as string) || null;
  const departureLon = parseFloat(formData.get("departureLon") as string) || null;
  const arrivalLat = parseFloat(formData.get("arrivalLat") as string) || null;
  const arrivalLon = parseFloat(formData.get("arrivalLon") as string) || null;

  await db
    .update(flights)
    .set({ departure, arrival, aircraft, tailNumber, flightNumber, flightradarUrl, depScenarioUrl, arrScenarioUrl, liveryUrl, notes, departureLat, departureLon, arrivalLat, arrivalLon })
    .where(eq(flights.id, id));

  revalidatePath("/");
}

export async function markAsDone(id: number, done: boolean) {
  await db.update(flights).set({ done }).where(eq(flights.id, id));
  revalidatePath("/");
  revalidatePath("/done");
}

export async function deleteFlight(id: number) {
  await db.delete(flights).where(eq(flights.id, id));
  revalidatePath("/");
  revalidatePath("/done");
}
