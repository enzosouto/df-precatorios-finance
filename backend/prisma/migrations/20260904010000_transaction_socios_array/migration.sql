-- AlterTable: replace single-value "socio" column with a "socios" array,
-- backfilling existing values so no data is lost.
ALTER TABLE "transactions" ADD COLUMN "socios" "Socio"[] NOT NULL DEFAULT '{}';

UPDATE "transactions" SET "socios" = ARRAY["socio"] WHERE "socio" IS NOT NULL;

DROP INDEX IF EXISTS "transactions_socio_idx";

ALTER TABLE "transactions" DROP COLUMN "socio";

ALTER TABLE "transactions" ALTER COLUMN "socios" DROP DEFAULT;
