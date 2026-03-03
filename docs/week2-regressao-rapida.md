# Checklist rapido de regressao - Semana 2

Objetivo: validar em cerca de 10 minutos os fluxos UI e controles RBAC entregues na Semana 2.

## 1. Pre-requisitos

1. Subir front e API:
   1. `npm run dev:api`
   2. `npm run dev:front`
2. Garantir variaveis de ambiente da API configuradas (`DATABASE_URL`, `SUPABASE_*`, `JWT_SECRET`).
3. Rodar regressao E2E com comando padrao:
   1. `npm run test:e2e`

## 2. Fluxos UI principais

Arquivo coberto: `apps/front/tests/e2e/week2-ui-flows.spec.ts`

1. Equipes:
   1. Abrir pagina Equipes.
   2. Abrir formulario de convite e enviar convite.
2. EAP:
   1. Atualizar responsavel da tarefa.
   2. Ajustar dependencia e clicar em Recarregar.
   3. Confirmar persistencia via API.
3. Orcamento:
   1. Adicionar/remover item.
   2. Salvar e recarregar pagina.
   3. Confirmar persistencia via API.

Resultado esperado:
- Fluxos concluem sem erro.
- Dados persistem apos reload.

## 3. RBAC Equipes

Arquivo coberto: `apps/front/tests/e2e/week2-rbac-ui.spec.ts`

1. Cenario ADMIN:
   1. ADMIN nao pode convidar OWNER.
   2. UI deve limitar opcoes de papel para MEMBER/VIEWER.
2. Cenario MEMBER:
   1. MEMBER nao pode convidar membros.
   2. API deve responder 403 na tentativa de convite.

Resultado esperado:
- Regras de papel respeitadas em UI e API.

## 4. RBAC EAP e Orcamento

Arquivo coberto: `apps/front/tests/e2e/week2-rbac-modules.spec.ts`

1. EAP:
   1. Revogar permissao de modulo `eap` para membro.
   2. Acessar rota da EAP.
   3. Ver tela de acesso restrito.
   4. Tentativa de criar item via API retorna 403.
2. Orcamento:
   1. Revogar permissao de modulo `budget` para membro.
   2. Acessar rota de Orcamento.
   3. Ver tela de acesso restrito.
   4. Tentativa de salvar orcamento via API retorna 403.

Resultado esperado:
- Bloqueio por modulo funcionando no front e no backend.

## 5. CI

Arquivo: `.github/workflows/ci.yml`

1. Job `build` valida lint e build.
2. Job `e2e` executa regressao E2E quando secrets obrigatorios existem.

Secrets minimos para job E2E:
1. `DATABASE_URL`
2. `SUPABASE_URL`
3. `SUPABASE_ANON_KEY`
4. `SUPABASE_SERVICE_ROLE_KEY`
5. `JWT_SECRET`

## 6. Criterio de aceite da Semana 2

Marcar Semana 2 como fechada quando:

1. `npm run test:e2e` passar localmente.
2. CI executar `build` com sucesso.
3. CI executar `e2e` quando secrets estiverem presentes.
4. Regras RBAC de Equipes, EAP e Orcamento estiverem cobertas por teste automatizado.
