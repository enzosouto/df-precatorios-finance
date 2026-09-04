-- CreateEnum
CREATE TYPE "OrigemPrecatorio" AS ENUM ('GDF', 'FEDERAL', 'OUTRO');

-- AlterTable: add nullable first, backfill existing rows, then enforce NOT NULL.
ALTER TABLE "precatorios" ADD COLUMN "origem" "OrigemPrecatorio";
ALTER TABLE "precatorios" ADD COLUMN "origemOutro" VARCHAR(200);

UPDATE "precatorios" SET "origem" = 'OUTRO', "origemOutro" = 'Legado (origem não informada)' WHERE "origem" IS NULL;

ALTER TABLE "precatorios" ALTER COLUMN "origem" SET NOT NULL;
