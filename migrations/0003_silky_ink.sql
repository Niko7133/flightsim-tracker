CREATE TABLE "airports" (
	"icao" text PRIMARY KEY NOT NULL,
	"iata" text,
	"name" text NOT NULL,
	"municipality" text,
	"iso_country" text,
	"lat" double precision,
	"lon" double precision,
	"elevation" double precision
);
