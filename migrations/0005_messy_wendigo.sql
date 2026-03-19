CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
INSERT INTO "users" ("email", "password") VALUES ('tua@email.com', 'placeholder');
--> statement-breakpoint
ALTER TABLE "flights" ADD COLUMN "user_id" integer;
UPDATE "flights" SET "user_id" = 1;
ALTER TABLE "flights" ALTER COLUMN "user_id" SET NOT NULL;
ALTER TABLE "flights" ADD CONSTRAINT "flights_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
