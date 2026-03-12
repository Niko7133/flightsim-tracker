import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) return NextResponse.json([]);

  const res = await fetch(`https://api.api-ninjas.com/v1/aircraft?model=${encodeURIComponent(q)}&limit=10`, { headers: { "X-Api-Key": process.env.API_NINJAS_KEY! } });

  if (!res.ok) return NextResponse.json([]);
  const data = await res.json();
  return NextResponse.json(data);
}
