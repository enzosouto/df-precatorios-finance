-- AlterTable
ALTER TABLE "precatorios" ADD COLUMN     "percentualCompra" DECIMAL(5,2) NOT NULL DEFAULT 0,
ADD COLUMN     "percentualVenda" DECIMAL(5,2) NOT NULL DEFAULT 0;
