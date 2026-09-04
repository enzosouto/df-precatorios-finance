-- CreateEnum
CREATE TYPE "Socio" AS ENUM ('CHIQUINHO', 'FILIPI', 'LOMAR');

-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "socio" "Socio";

-- CreateIndex
CREATE INDEX "transactions_socio_idx" ON "transactions"("socio");
