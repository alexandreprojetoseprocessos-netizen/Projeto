# Semana 4: Release Checklist

## Objetivo
Checklist operacional mínimo para publicar uma nova versão sem depender de memória ou validação manual solta.

## Antes do deploy
1. Confirmar `git status` limpo.
2. Confirmar `main` sincronizada com `origin/main`.
3. Rodar build local:
   - `npm run --workspace apps/front build`
   - `npm run --workspace apps/api build`
4. Rodar regressão principal:
   - `npm run test:e2e`
5. Rodar smoke local com serviços ativos:
   - `npm run release:smoke`

## Banco e migrações
1. Validar se existe migration pendente em `apps/database/prisma/migrations`.
2. Aplicar migrações no ambiente alvo:
   - `npm run db:migrate`
3. Confirmar `prisma generate` sem erro após migração.
4. Garantir backup ou snapshot antes de alterações estruturais.

## Variáveis e integrações
1. Confirmar `DATABASE_URL`.
2. Confirmar `SUPABASE_URL`.
3. Confirmar `SUPABASE_ANON_KEY`.
4. Confirmar `SUPABASE_SERVICE_ROLE_KEY`.
5. Confirmar `JWT_SECRET`.
6. Confirmar credenciais de pagamento se o fluxo estiver ativo.
7. Se alerta por e-mail estiver habilitado, confirmar:
   - `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`
   - `SMTP_USER`, `SMTP_PASS`
   - `SMTP_FROM`
   - `SMTP_CRITICAL_ALERTS_ENABLED`

## Validação funcional mínima
1. Login.
2. Troca de organização.
3. Troca de projeto atual.
4. EAP abrindo e carregando tarefas.
5. Kanban abrindo e movendo tarefa.
6. Orçamento salvando e persistindo após `F5`.
7. Equipes carregando mesmo com falhas isoladas.
8. Relatórios abrindo sem erro de permissão.
9. Meu plano carregando billing e auditoria.

## Validação visual mínima
1. Hero e cabeçalho das páginas principais renderizando sem quebra.
2. Estados vazios aparecendo com card padronizado.
3. Onboarding operacional visível em `Projetos`, `EAP`, `Kanban` e `Documentos` quando o projeto ainda está no início.
4. Mobile sem overflow horizontal indevido nas telas ajustadas.

## Pós-deploy
1. Rodar `npm run release:smoke` apontando para as URLs do ambiente.
2. Verificar `/health` da API.
3. Abrir front publicado e validar login.
4. Validar um fluxo completo em produção:
   - selecionar organização
   - abrir projeto
   - abrir EAP
   - abrir Kanban
   - abrir Documentos
5. Registrar versão publicada e data.

## Fechamento da Semana 4
1. Performance:
   - code splitting por rota ativo
   - vendors pesados separados em chunks dedicados
2. UX:
   - heroes padronizados
   - estados vazios padronizados
   - onboarding inicial e operacional conectados
3. Robustez:
   - fallback global de rota
   - telemetria básica de erro no cliente
4. Operação:
   - smoke de release versionado
   - checklist de publicação documentado

## Variáveis opcionais para smoke
- `SMOKE_FRONT_URL`
- `SMOKE_API_URL`
- `SMOKE_TIMEOUT_MS`
