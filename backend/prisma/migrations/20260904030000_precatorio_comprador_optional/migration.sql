-- AlterTable: comprador becomes optional (some precatórios don't have a buyer assigned yet).
ALTER TABLE "precatorios" ALTER COLUMN "comprador" DROP NOT NULL;
