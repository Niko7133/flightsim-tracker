"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { flights } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { users } from "@/db/schema";
import bcrypt from "bcryptjs";

async function getUserId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Non autenticato");
  return parseInt(session.user.id);
}

export async function addFlight(formData: FormData) {
  const userId = await getUserId();
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
    userId,
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
  const userId = await getUserId();
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
    .set({
      departure,
      arrival,
      aircraft,
      tailNumber,
      flightNumber,
      flightradarUrl,
      depScenarioUrl,
      arrScenarioUrl,
      liveryUrl,
      notes,
      departureLat,
      departureLon,
      arrivalLat,
      arrivalLon,
    })
    .where(eq(flights.id, id) && eq(flights.userId, userId));

  revalidatePath("/");
}

export async function markAsDone(id: number, done: boolean) {
  const userId = await getUserId();
  await db
    .update(flights)
    .set({ done })
    .where(eq(flights.id, id) && eq(flights.userId, userId));
  revalidatePath("/");
  revalidatePath("/done");
}

export async function deleteFlight(id: number) {
  const userId = await getUserId();
  await db.delete(flights).where(eq(flights.id, id) && eq(flights.userId, userId));
  revalidatePath("/");
  revalidatePath("/done");
}

export async function updateAccount(formData: FormData) {
  const userId = await getUserId();
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const newPassword = formData.get("newPassword") as string;
  const currentPassword = formData.get("currentPassword") as string;

  const user = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .then((r) => r[0]);
  if (!user) throw new Error("Utente non trovato");

  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) throw new Error("Password attuale errata");

  const updates: Partial<typeof users.$inferInsert> = { name, email };
  if (newPassword) updates.password = await bcrypt.hash(newPassword, 12);

  await db.update(users).set(updates).where(eq(users.id, userId));
  revalidatePath("/");
}
