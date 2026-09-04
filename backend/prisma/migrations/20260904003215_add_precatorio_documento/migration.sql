-- CreateEnum
CREATE TYPE "DocumentoTipo" AS ENUM ('PROCURACAO', 'ESCRITURA');

-- AlterTable
ALTER TABLE "precatorios" ADD COLUMN     "numeroDocumento" VARCHAR(100),
ADD COLUMN     "tipoDocumento" "DocumentoTipo";
