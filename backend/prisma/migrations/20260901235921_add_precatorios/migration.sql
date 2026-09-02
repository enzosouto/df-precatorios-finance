-- CreateTable
CREATE TABLE "precatorios" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cedente" TEXT NOT NULL,
    "valorOriginal" DECIMAL(14,2) NOT NULL,
    "valorAtualizado" DECIMAL(14,2) NOT NULL,
    "diferenca" DECIMAL(14,2) NOT NULL,
    "valorPago" DECIMAL(14,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "precatorios_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "precatorios_userId_idx" ON "precatorios"("userId");

-- CreateIndex
CREATE INDEX "precatorios_deletedAt_idx" ON "precatorios"("deletedAt");

-- CreateIndex
CREATE INDEX "precatorios_cedente_idx" ON "precatorios"("cedente");

-- CreateIndex
CREATE INDEX "precatorios_userId_deletedAt_idx" ON "precatorios"("userId", "deletedAt");

-- AddForeignKey
ALTER TABLE "precatorios" ADD CONSTRAINT "precatorios_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
