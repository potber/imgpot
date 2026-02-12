DELETE FROM "image_variations" WHERE "variation_type" = 'original';--> statement-breakpoint
ALTER TABLE "image_variations" ALTER COLUMN "variation_type" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."variation_type";--> statement-breakpoint
CREATE TYPE "public"."variation_type" AS ENUM('large', 'medium', 'small');--> statement-breakpoint
ALTER TABLE "image_variations" ALTER COLUMN "variation_type" SET DATA TYPE "public"."variation_type" USING "variation_type"::"public"."variation_type";