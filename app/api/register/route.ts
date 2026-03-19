import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  if (!email || !password) return NextResponse.json({ error: "Dati mancanti" }, { status: 400 });
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .then((r) => r[0]);
  if (existing) return NextResponse.json({ error: "Email già registrata" }, { status: 400 });
  const hashed = await bcrypt.hash(password, 12);
  await db.insert(users).values({ email, password: hashed });
  return NextResponse.json({ ok: true });
}
