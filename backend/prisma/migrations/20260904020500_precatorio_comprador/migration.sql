-- AlterTable: add nullable first, backfill existing rows, then enforce NOT NULL.
ALTER TABLE "precatorios" ADD COLUMN "comprador" VARCHAR(200);

UPDATE "precatorios" SET "comprador" = 'Legado (comprador não informado)' WHERE "comprador" IS NULL;

ALTER TABLE "precatorios" ALTER COLUMN "comprador" SET NOT NULL;
