import { pgTable, serial, text, boolean, timestamp, doublePrecision } from "drizzle-orm/pg-core";

export const flights = pgTable("flights", {
  id: serial("id").primaryKey(),
  departure: text("departure").notNull(),
  arrival: text("arrival").notNull(),
  aircraft: text("aircraft"),
  tailNumber: text("tail_number"),
  flightNumber: text("flight_number"),
  flightradarUrl: text("flightradar_url"),
  airline: text("airline"),
  notes: text("notes"),
  done: boolean("done").default(false).notNull(),
  departureLat: doublePrecision("departure_lat"),
  departureLon: doublePrecision("departure_lon"),
  arrivalLat: doublePrecision("arrival_lat"),
  arrivalLon: doublePrecision("arrival_lon"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  depScenarioUrl: text("dep_scenario_url"),
  arrScenarioUrl: text("arr_scenario_url"),
  liveryUrl: text("livery_url"),
});

export const airports = pgTable("airports", {
  icao: text("icao").primaryKey(),
  iata: text("iata"),
  name: text("name").notNull(),
  municipality: text("municipality"),
  country: text("iso_country"),
  lat: doublePrecision("lat"),
  lon: doublePrecision("lon"),
  elevation: doublePrecision("elevation"),
});

export type Flight = typeof flights.$inferSelect;
export type NewFlight = typeof flights.$inferInsert;
export type Airport = typeof airports.$inferSelect;
