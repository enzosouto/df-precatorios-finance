# Testes — DF Precatórios Finance (backend)

Os testes (`vitest` + `supertest`) rodam contra um Postgres **real** (não há mocks
de Prisma) porque grande parte do valor dos testes está na matemática financeira
(somas em `Decimal`, agrupamento por mês, soft delete). Para isso é necessário um
banco de dados de teste separado do banco de desenvolvimento.

## 1. Subir o Postgres (docker-compose na raiz do repositório)

Na raiz do repositório (`DF Precatorios Finance/`, não em `backend/`):

```bash
docker compose up -d postgres
```

Isso sobe o Postgres 16 definido em `docker-compose.yml` com:
- usuário: `dfprecatorios`
- senha: `dfprecatorios`
- banco (dev): `df_precatorios_finance`
- porta: `5432`

## 2. Criar o banco de teste

O banco de dev já é criado automaticamente pelo container. O banco de **teste**
precisa ser criado manualmente uma vez:

```bash
docker exec -it df-precatorios-finance-db psql -U dfprecatorios -d postgres -c "CREATE DATABASE df_precatorios_finance_test;"
```

## 3. Configurar variáveis de ambiente

Copie `backend/.env.example` para `backend/.env` e preencha com os valores de
desenvolvimento (apontando para `df_precatorios_finance`). O arquivo
`backend/.env.test` (também ignorado pelo git) deve apontar para o banco de
teste:

```
DATABASE_URL=postgresql://dfprecatorios:dfprecatorios@localhost:5432/df_precatorios_finance_test
JWT_SECRET=test-secret-do-not-use-in-production-abcdefg
FRONTEND_URL=http://localhost:5173
PORT=4001
ADMIN_EMAIL=admin@dfprecatorios.com.br
ADMIN_PASSWORD=TrocarSenha123!
NODE_ENV=test
```

`tests/setup.ts` carrega `.env.test` (com `override: true`) antes de qualquer
teste rodar, então o `DATABASE_URL` usado pelo Prisma durante os testes é
sempre o do banco de teste — os testes nunca tocam o banco de desenvolvimento.

## 4. Rodar as migrações no banco de teste

```bash
cd backend
npm install
DATABASE_URL="postgresql://dfprecatorios:dfprecatorios@localhost:5432/df_precatorios_finance_test" npx prisma migrate deploy
```

(No Windows/Git Bash, defina a variável antes do comando como acima; em
PowerShell use `$env:DATABASE_URL=...` antes de chamar `npx prisma migrate deploy`.)

## 5. Rodar os testes

```bash
npm test
```

Cada arquivo de teste limpa as tabelas (`transaction`, `category`, `user`) em
`beforeEach` antes de popular seus próprios dados — não depende de dados de
seed. `vitest.config.ts` roda os arquivos de teste sequencialmente
(`fileParallelism: false`) porque todos compartilham o mesmo banco de teste.

## Rodando as migrações de desenvolvimento (fora dos testes)

```bash
cd backend
npx prisma migrate dev      # cria/aplica migrações a partir do schema.prisma
npm run seed                 # cria o usuário admin e as categorias padrão
```

## Status real (última execução nesta máquina)

`npm install`, `npm run typecheck`, `npm run lint`, `npm run build` e
`npm test` foram executados de fato contra um Postgres real (container Docker
local) e todos passaram: **31/31 testes** em 6 arquivos (inclui o novo recurso
`Precatorio`, adicionado em `add_precatorios`).
