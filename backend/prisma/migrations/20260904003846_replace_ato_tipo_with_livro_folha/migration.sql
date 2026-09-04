/*
  Warnings:

  - You are about to drop the column `numeroAto` on the `precatorios` table. All the data in the column will be lost.
  - You are about to drop the column `tipoAto` on the `precatorios` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "precatorios" DROP COLUMN "numeroAto",
DROP COLUMN "tipoAto",
ADD COLUMN     "folha" VARCHAR(20),
ADD COLUMN     "livro" VARCHAR(20);

-- DropEnum
DROP TYPE "AtoTipo";
