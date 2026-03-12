import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const flightNumber = req.nextUrl.searchParams.get("flight")?.toUpperCase().trim();
  if (!flightNumber) return NextResponse.json(null);

  // Estrai il prefisso IATA (prime 2 lettere) o ICAO (prime 3 lettere)
  const iataCode = flightNumber.match(/^([A-Z]{2})\d/)?.[1];
  const icaoCode = flightNumber.match(/^([A-Z]{3})\d/)?.[1];

  const code = iataCode ?? icaoCode;
  if (!code) return NextResponse.json(null);

  const res = await fetch(`https://api.api-ninjas.com/v1/airlines?iata=${iataCode ?? ""}&icao=${icaoCode ?? ""}`, { headers: { "X-Api-Key": process.env.API_NINJAS_KEY! } });

  if (!res.ok) return NextResponse.json(null);
  const data = await res.json();
  const airline = data?.[0];
  if (!airline) return NextResponse.json(null);

  return NextResponse.json({
    name: airline.name,
    iata: airline.iata,
    icao: airline.icao,
    country: airline.country
  });
}
