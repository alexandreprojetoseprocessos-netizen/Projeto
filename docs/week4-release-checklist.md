# Semana 4: Release Checklist

## Objetivo
Checklist operacional minimo para publicar uma nova versao sem depender de memoria ou validacao manual solta.

## Antes do deploy
1. Confirmar `git status` limpo.
2. Confirmar `main` sincronizada com `origin/main`.
3. Rodar build local:
   - `npm run --workspace apps/front build`
   - `npm run --workspace apps/api build`
4. Rodar regressao principal:
   - `npm run test:e2e`
5. Rodar smoke local com servicos de pe:
   - `npm run release:smoke`

## Banco e migracoes
1. Validar se existe migration pendente em `apps/database/prisma/migrations`.
2. Aplicar migracoes no ambiente alvo:
   - `npm run db:migrate`
3. Confirmar `prisma generate` sem erro apos migracao.
4. Garantir backup ou snapshot antes de alteracoes estruturais.

## Variaveis e integracoes
1. Confirmar `DATABASE_URL`.
2. Confirmar `SUPABASE_URL`.
3. Confirmar `SUPABASE_ANON_KEY`.
4. Confirmar `SUPABASE_SERVICE_ROLE_KEY`.
5. Confirmar `JWT_SECRET`.
6. Confirmar credenciais de pagamento se o fluxo estiver ativo.

## Validacao funcional minima
1. Login.
2. Troca de organizacao.
3. Troca de projeto atual.
4. EAP abrindo e carregando tarefas.
5. Kanban abrindo e movendo tarefa.
6. Orcamento salvando e persistindo apos F5.
7. Equipes carregando mesmo com falhas isoladas.
8. Relatorios abrindo sem erro de permissao.
9. Meu plano carregando billing e auditoria.

## Validacao visual minima
1. Hero e cabecalho das paginas principais renderizando sem quebra.
2. Estados vazios aparecendo com card padronizado.
3. Mobile sem overflow horizontal indevido nas telas ajustadas.

## Pos-deploy
1. Rodar `npm run release:smoke` apontando para as URLs do ambiente.
2. Verificar `/health` da API.
3. Abrir front publicado e validar login.
4. Validar um fluxo completo em producao:
   - selecionar organizacao
   - abrir projeto
   - abrir EAP
   - abrir Kanban
5. Registrar versao publicada e data.

## Variaveis opcionais para smoke
- `SMOKE_FRONT_URL`
- `SMOKE_API_URL`
- `SMOKE_TIMEOUT_MS`
