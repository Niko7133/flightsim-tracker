import { neon } from "@netlify/neon";
import { drizzle } from "drizzle-orm/neon-http";
import { airports } from "../db/schema";
import { parse } from "csv-parse/sync";
import * as fs from "fs";
import * as path from "path";

const sql = neon(process.env.NETLIFY_DATABASE_URL!);
const db = drizzle(sql);

async function main() {
  const csvPath = path.join(process.cwd(), "scripts", "airports.csv");
  const content = fs.readFileSync(csvPath, "utf-8");

  const records = parse(content, { columns: true, skip_empty_lines: true });

  const rows = records
    .filter((r: any) => r.icao_code && r.icao_code.length === 4)
    .map((r: any) => ({
      icao: r.icao_code,
      iata: r.iata_code || null,
      name: r.name,
      municipality: r.municipality || null,
      country: r.iso_country || null,
      lat: r.latitude_deg ? parseFloat(r.latitude_deg) : null,
      lon: r.longitude_deg ? parseFloat(r.longitude_deg) : null,
      elevation: r.elevation_ft ? parseFloat(r.elevation_ft) : null
    }));

  console.log(`Importing ${rows.length} airports...`);

  // Insert a batch da 500
  for (let i = 0; i < rows.length; i += 500) {
    const batch = rows.slice(i, i + 500);
    await db.insert(airports).values(batch).onConflictDoNothing();
    process.stdout.write(`\r${i + batch.length}/${rows.length}`);
  }

  console.log("\nDone!");
}

main().catch(console.error);
