ALTER TABLE "transactions" ADD COLUMN "precatorioId" TEXT;
CREATE UNIQUE INDEX "transactions_precatorioId_key" ON "transactions"("precatorioId");
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_precatorioId_fkey" FOREIGN KEY ("precatorioId") REFERENCES "precatorios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
