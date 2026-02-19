# Checklist rapido de regressao - Semana 1

Objetivo: validar em ~5 minutos os ajustes de hardening, encoding e fluxo critico (Equipes, EAP e Orcamento).

## 1. Pre-requisitos

1. Subir API e Front:
   1. `npm --prefix apps/api run dev`
   2. `npm --prefix apps/front run dev`
2. Entrar com usuario autenticado.
3. Selecionar uma organizacao valida no cabecalho.
4. Selecionar um projeto especifico (nao usar "Todos" para Orcamento).

## 2. Equipes - carga de tarefas sem erro em cascata

1. Abrir pagina `Equipes`.
2. Abrir DevTools > Network e filtrar por `wbs?projectId=`.
3. Confirmar que a tela carrega mesmo se alguma requisicao de projeto falhar.

Resultado esperado:
- Sem quebra de pagina.
- Mensagem de erro geral so aparece quando houver falha critica.
- Falhas 400/403/404 isoladas nao devem bloquear toda a tela.

## 3. Equipes - convite com regras de permissao

1. Clicar em `Adicionar membro`.
2. Selecionar organizacao no campo de convite.
3. Validar que papeis disponiveis respeitam regra:
   1. OWNER pode convidar ADMIN/MEMBER/VIEWER.
   2. ADMIN pode convidar MEMBER/VIEWER.
4. Enviar convite com email valido.

Resultado esperado:
- Convite enviado sem erro de validacao.
- Mensagens em portugues legivel (sem texto quebrado).

## 4. EAP - responsavel da tarefa

1. Abrir `EAP`.
2. Em uma tarefa de nivel executavel, alterar o responsavel.
3. Salvar e recarregar a pagina.

Resultado esperado:
- Responsavel permanece salvo apos reload.
- Sem erro 400 no endpoint de membros do projeto.

## 5. EAP - criacao de tarefa e dependencia

1. Criar nova tarefa em um projeto ativo.
2. Ajustar dependencia da tarefa.
3. Clicar em `Recarregar` (ajuste de datas por dependencia).

Resultado esperado:
- Tarefa criada sem erro.
- Dependencia salva.
- Datas ajustadas conforme dependencia + quantidade de dias.

## 6. Orcamento - persistencia real

1. Abrir `Orcamento` com projeto especifico.
2. Alterar `Valor do Projeto`.
3. Remover um item de custo e salvar (`Salvar agora`).
4. Atualizar a pagina (F5).

Resultado esperado:
- Valor e itens permanecem iguais apos reload.
- Nao reaparece valor antigo automaticamente.
- Status de salvamento mostra sucesso.

## 7. Verificacao tecnica rapida (opcional)

1. Validar build:
   1. `npm --prefix apps/api run build`
   2. `npm --prefix apps/front run build`
2. Validar lint:
   1. `npm --prefix apps/front run lint`

Resultado esperado:
- Build API/Front sem erro.
- Lint pode ter warnings antigos, mas sem erro bloqueante.

## 8. Critério de aceite da Semana 1

Marcar como concluido quando todos os itens abaixo forem verdadeiros:

1. Sem erro de hooks em runtime na pagina de Orcamento (`ActivitiesPage`).
2. Sem erro de rota duplicada de membros (`/projects/:projectId/members` unificada).
3. Sem regressao no fluxo de responsavel da EAP.
4. Persistencia de Orcamento confirmada apos reload.
5. Textos principais sem mojibake nas telas de Equipes/EAP/Orcamento.
