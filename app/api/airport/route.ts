import { NextRequest, NextResponse } from "next/server";
import { neon } from "@netlify/neon";
import { drizzle } from "drizzle-orm/neon-http";
import { airports } from "@/db/schema";
import { eq, or } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("icao")?.toUpperCase().trim();
  if (!raw || raw.length < 3) return NextResponse.json(null);

  const sql = neon(process.env.NETLIFY_DATABASE_URL!);
  const db = drizzle(sql);

  // Cerca per ICAO o IATA
  const results = await db
    .select()
    .from(airports)
    .where(raw.length === 4 ? eq(airports.icao, raw) : eq(airports.iata, raw))
    .limit(1);

  const airport = results[0];
  if (!airport) return NextResponse.json(null);

  let weather = null;
  let localTime = null;

  if (airport.lat && airport.lon) {
    const meteo = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${airport.lat}&longitude=${airport.lon}&current=temperature_2m,weather_code&timezone=auto`);
    const meteoData = await meteo.json();
    weather = meteoData.current;
    if (meteoData.timezone) {
      localTime = new Date().toLocaleTimeString("it-IT", {
        timeZone: meteoData.timezone,
        hour: "2-digit",
        minute: "2-digit"
      });
    }
  }

  return NextResponse.json({
    icao: airport.icao,
    name: airport.name,
    municipality: airport.municipality,
    country: airport.country,
    elevation: airport.elevation,
    lat: airport.lat,
    lon: airport.lon,
    localTime,
    weather
  });
}
