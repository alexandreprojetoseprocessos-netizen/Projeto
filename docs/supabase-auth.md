# Supabase Auth – Fluxo de configuração

Este projeto usa o Supabase como provedor único de autenticação. O backend exige que cada requisição traga um token `Bearer` emitido pelo Supabase Auth. O mesmo token é usado pelo frontend (Vite/React) para chamar a API.

## 1. Pré-requisitos

1. Crie um projeto Supabase (Dashboard → New project) e obtenha os dados a seguir:
   - `SUPABASE_URL` (URL pública do projeto)
   - `SUPABASE_ANON_KEY` (chave pública)
   - `SUPABASE_SERVICE_ROLE_KEY` (chave privada service_role)
2. No Supabase Studio, vá em **Authentication → Providers → Email** e habilite o login por e-mail/senha. Opcionalmente configure SMTP próprio.

## 2. Arquivo `.env`

Defina as variáveis obrigatórias na raiz do monorepo:

```
SUPABASE_URL=https://<seu-projeto>.supabase.co
SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```

> **Importante:** o backend (`apps/api`) agora falha com 401 se `Authorization` estiver ausente ou inválido. Sem a `SUPABASE_SERVICE_ROLE_KEY`, a API não sobe (erro configurado no middleware).

## 3. Criar usuários padrão

No Supabase Studio, abra **Authentication → Users** e adicione os usuários de teste. Para automatizar, utilize `docs/supabase-users.json` com a CLI:

```bash
supabase auth import --file docs/supabase-users.json --admin-secret <service_role_key>
```

Cada entrada inclui `email`, `password`, `role` e metadados (ex.: `full_name`). Ajuste conforme necessidade.

## 4. Fluxo no frontend

- `apps/front/src/contexts/AuthContext.tsx`: encapsula `supabase.auth` e expõe `status`, `user`, `token`, `signIn`, `signOut`.
- `apps/front/src/App.tsx`: renderiza uma tela de login se `status !== "authenticated"`. Quando há sessão, inclui o token em todos os `fetch` feitos para o backend.

## 5. Middleware no backend

- `apps/api/src/middleware/auth.ts`: todas as rotas (`/projects`, `/wbs`) usam o middleware. Ele obtém o token do header `Authorization`, chama `supabase.auth.getUser(token)` usando a `service_role_key` e injeta `req.user`.
- Se o token não existir ou for inválido, responde `401`.

## 6. RBAC nos metadados

O Supabase `user_metadata` e `app_metadata` permitem indicar papéis. Exemplos (ver `docs/supabase-users.json`):

```json
"app_metadata": { "role": "OWNER" },
"user_metadata": { "full_name": "Gestor Demo" }
```

Use esses valores para sincronizar com `OrganizationMembership` / `ProjectMember`. Futuras rotas podem mapear automaticamente o papel do usuário logado.

## 7. Teste local

1. `npm run dev:api` (certifique-se de que `.env` está atualizado).
2. `npm run dev:front`.
3. Acesse `http://localhost:5173`; faça login com um usuário existente (ex.: `gestor@gp.local / SenhaDemo123!`). O painel deve carregar dados dos endpoints protegidos.

Em caso de erro 401, confira se o access token está sendo enviado (DevTools → aba Network) e se a data/hora da máquina está correta (tokens expiram).
