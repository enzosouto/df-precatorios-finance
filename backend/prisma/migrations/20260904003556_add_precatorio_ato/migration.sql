-- CreateEnum
CREATE TYPE "AtoTipo" AS ENUM ('LIVRO', 'FOLHA');

-- AlterTable
ALTER TABLE "precatorios" ADD COLUMN     "numeroAto" VARCHAR(100),
ADD COLUMN     "tipoAto" "AtoTipo";
