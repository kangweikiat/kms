ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "name" TEXT;
UPDATE "Student" SET "name" = "firstName" || ' ' || "lastName";
ALTER TABLE "Student" ALTER COLUMN "name" SET NOT NULL;
ALTER TABLE "Student" DROP COLUMN "firstName";
ALTER TABLE "Student" DROP COLUMN "lastName";
