CREATE TABLE "flights" (
	"id" serial PRIMARY KEY NOT NULL,
	"departure" text NOT NULL,
	"arrival" text NOT NULL,
	"aircraft" text,
	"notes" text,
	"done" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
