# G&P — Sistema de Gestão de Projetos

Monorepositório com API (Express + Prisma), frontend (React + Vite) e camada de banco (Prisma).

## Estrutura

```
apps/
  api/        # Node.js + Express + Prisma Client
  front/      # React + Vite + Supabase client
  database/   # Prisma schema, migrations e seeds
docs/         # Documentação funcional/técnica
scripts/      # Automação (deploy, seed, backups)
.env.example  # Variáveis necessárias
```

## Requisitos

- Node.js >= 20
- Supabase configurado

## Instalação

```
npm install
```

## Desenvolvimento

```
npm run dev:api     # API em http://localhost:4000
npm run dev:front   # Frontend em http://localhost:5173
```

## Banco de dados / Prisma

```
npm run db:migrate
npm run db:seed
npm run prisma:generate
```

## Variáveis de ambiente

Copie `.env.example` para `.env` e ajuste conforme necessário. Principais:

- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `VITE_API_BASE_URL`, `FRONTEND_URL`, `PUBLIC_API_URL`
- `MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET`

## Mercado Pago (checkout e webhook)

- O endpoint de checkout é `POST /billing/checkout`.
- O webhook é `POST /billing/webhook`.
- Configure `PUBLIC_API_URL` para o endereço público da API (Render/Ngrok).

Teste local com Ngrok:

```
ngrok http 4000
```

Depois, configure `PUBLIC_API_URL` e o webhook no painel do Mercado Pago:

```
PUBLIC_API_URL=https://<seu-subdominio>.ngrok-free.app
```

Webhook:

```
https://<seu-subdominio>.ngrok-free.app/billing/webhook
```

## Scripts úteis

```
npm run lint
```
