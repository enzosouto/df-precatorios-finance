ALTER TABLE "precatorios" ADD COLUMN "valorVendido" DECIMAL(14,2);

UPDATE "precatorios" SET "valorPago" = 0 WHERE "valorPago" IS NULL;

ALTER TABLE "precatorios" ALTER COLUMN "valorPago" SET NOT NULL;
ALTER TABLE "precatorios" DROP COLUMN "valorOriginal";
ALTER TABLE "precatorios" DROP COLUMN "diferenca";
ALTER TABLE "precatorios" DROP COLUMN "percentualVenda";
ALTER TABLE "precatorios" DROP COLUMN "percentualCompra";
