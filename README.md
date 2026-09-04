# DF PRECATORIOS FINANCE

Sistema financeiro interno da **DF PRECATÓRIOS**. Permite registrar receitas e
despesas, acompanhar o caixa da empresa e manter um cadastro de precatórios
(cedente, valor original, valor atualizado, diferença e valor pago).

Feito para ser extremamente simples de usar: letras grandes, poucos menus,
tudo em português.

## Stack

| Camada    | Tecnologia |
|-----------|------------|
| Frontend  | Vue 3 + TypeScript + Vite + Vue Router + Pinia + Tailwind CSS + Chart.js |
| Backend   | Node.js + TypeScript + Express + Prisma |
| Banco     | PostgreSQL (Neon em produção) |
| Deploy    | Vercel (frontend) + Render (backend) + Neon (banco) |

## Arquitetura

Monorepo simples com duas pastas independentes:

```
backend/    API REST (Express + Prisma), autenticação por cookie httpOnly
frontend/   SPA Vue 3, consome a API via VITE_API_URL
```

Regras de negócio importantes:

- **Nenhum dado financeiro é apagado fisicamente.** Excluir uma movimentação
  ou um precatório apenas marca `deletedAt` (soft delete) — a linha continua
  no banco para fins de auditoria/histórico.
- Valores monetários são `NUMERIC/DECIMAL` no Postgres e trafegam como
  strings decimais na API (nunca `float`), para não perder precisão.
- Autenticação é via cookie `httpOnly` (JWT), nunca lida pelo JavaScript do
  frontend. O frontend só sabe se está logado perguntando `GET /auth/me`.
- Login usa **usuário simples** (não precisa ser um e-mail de verdade), ex:
  `admin`.
- O sistema começa **zerado** em produção — sem dados fictícios. Só existe o
  usuário admin e a lista padrão de categorias.

## Rodando localmente

Pré-requisitos: Node.js 20+, Docker (para o Postgres local).

### 1. Banco de dados local

```bash
docker compose up -d postgres
```

Sobe um Postgres em `localhost:5432` (usuário/senha/banco:
`dfprecatorios`/`dfprecatorios`/`df_precatorios_finance`).

### 2. Backend

```bash
cd backend
cp .env.example .env     # preencha DATABASE_URL, JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
npm install
npx prisma migrate dev   # cria as tabelas
npm run seed             # cria o usuário admin + categorias padrão
npm run dev              # http://localhost:4000
```

### 3. Frontend

```bash
cd frontend
cp .env.example .env      # VITE_API_URL=http://localhost:4000
npm install
npm run dev               # http://localhost:5173
```

Acesse `http://localhost:5173`, faça login com o usuário/senha definidos em
`ADMIN_EMAIL`/`ADMIN_PASSWORD`.

### Testes

```bash
# backend (precisa do Postgres local rodando; usa um banco de teste separado)
cd backend && npm test

# frontend
cd frontend && npm test
```

Veja `backend/TESTING.md` para detalhes do banco de teste.

## Variáveis de ambiente

### Backend (`backend/.env`)

```
DATABASE_URL=       # string de conexão do Postgres (Neon em produção)
JWT_SECRET=         # string aleatória longa (nunca reaproveite a de dev)
FRONTEND_URL=       # origem exata do frontend, para CORS + cookie cross-site
PORT=4000
ADMIN_EMAIL=        # usuário do admin (ex: admin)
ADMIN_PASSWORD=     # senha do admin (só usada pelo script de seed)
NODE_ENV=production
```

### Frontend (`frontend/.env`)

```
VITE_API_URL=       # URL pública do backend, ex: https://df-precatorios-api.onrender.com
```

Nunca commitar `.env`. Use sempre `.env.example` como referência.

## Deploy

### 1. Neon (banco)

1. Criar um projeto no [Neon](https://neon.tech).
2. Copiar a connection string (`DATABASE_URL`).
3. Rodar as migrations contra o Neon:
   ```bash
   cd backend
   DATABASE_URL="<url do neon>" npx prisma migrate deploy
   DATABASE_URL="<url do neon>" ADMIN_EMAIL="admin" ADMIN_PASSWORD="<senha forte>" npx tsx prisma/seed.ts
   ```

### 2. Render (backend)

1. Criar um **Web Service** apontando para este repositório, `Root Directory: backend`.
2. Build command: `npm install --include=dev && npm run build && npx prisma migrate deploy`
   (`--include=dev` é necessário porque o TypeScript/Prisma CLI são
   devDependencies e o Render roda o build com `NODE_ENV=production`)
3. Start command: `npm start`
4. Health check path: `/health`
5. Variáveis de ambiente: as mesmas de `backend/.env.example`, com o
   `DATABASE_URL` do Neon e `FRONTEND_URL` apontando para a URL da Vercel.

### 3. Vercel (frontend)

1. Importar este repositório na Vercel, `Root Directory: frontend`.
2. Framework preset: Vite. Build command `npm run build`, output `dist`.
3. Variável de ambiente: `VITE_API_URL` apontando para a URL pública do
   backend no Render.
4. Depois do primeiro deploy, atualizar `FRONTEND_URL` no Render com a URL
   final da Vercel (evita problema de CORS/cookie).

### 4. Primeiro usuário

O único usuário é criado pelo script de seed (`npm run seed` /
`npx tsx prisma/seed.ts`), nunca hardcoded no código. Guarde a senha em local
seguro; ela pode ser trocada dentro do sistema em **Configurações**.

## Segurança

- Senhas com **argon2id**.
- Sessão via JWT em cookie `httpOnly`, `secure` + `SameSite=None` em produção.
- Rate limiting no login (10 tentativas / 15 min por IP + usuário).
- `helmet` para cabeçalhos de segurança, CORS restrito a `FRONTEND_URL`.
- Toda validação de entrada é refeita no backend (nunca confia só no frontend).
- Segredos somente em variáveis de ambiente — nunca no código-fonte.
