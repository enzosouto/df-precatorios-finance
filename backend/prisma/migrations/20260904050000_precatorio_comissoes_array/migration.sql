ALTER TABLE "precatorios" ADD COLUMN "comissoes" DECIMAL(14,2)[] NOT NULL DEFAULT '{}';
UPDATE "precatorios" SET "comissoes" = ARRAY["comissao"] WHERE "comissao" IS NOT NULL;
ALTER TABLE "precatorios" DROP COLUMN "comissao";
