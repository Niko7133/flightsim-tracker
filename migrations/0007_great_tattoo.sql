ALTER TABLE "users" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "users" CASCADE;--> statement-breakpoint
--> statement-breakpoint
ALTER TABLE "flights" DROP COLUMN "user_id";
