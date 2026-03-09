# Manual do Usuario - Meu G&P

Versao: 1.0  
Ultima atualizacao: 09/03/2026

## 1. Objetivo
Este manual explica como usar o Meu G&P no dia a dia: criar projetos, planejar EAP, executar no Kanban, controlar orcamento, trabalhar com documentos, acompanhar relatorios, gerenciar equipe e usar integracoes.

## 2. Perfis e acesso
O sistema opera por organizacao e por perfil.

- `OWNER`: controle total da organizacao, plano, equipe, permissoes e integracoes.
- `ADMIN`: gestao operacional completa (projetos, equipe, permissoes, integracoes).
- `MEMBER`: operacao de projeto conforme permissoes liberadas.
- `VIEWER` (quando aplicavel): visualizacao, sem alteracoes.

Importante:
- Algumas telas exigem organizacao selecionada no cabecalho.
- O seletor `Todos os projetos` so deve ser usado nas paginas onde o sistema permite (ex.: Dashboard, Kanban, Cronograma, Orcamento, Documentos, Relatorios).

## 3. Primeiro acesso
1. Entre com seu usuario e senha.
2. Selecione a organizacao no cabecalho.
3. Selecione o projeto atual no cabecalho.
4. Confira se o menu lateral exibiu os modulos liberados para seu perfil.

## 4. Navegacao principal
Menu lateral:
- `Organizacoes`
- `Dashboard`
- `Projetos`
- `EAP`
- `Kanban`
- `Cronograma`
- `Diagrama`
- `Orcamento`
- `Documentos`
- `Relatorios`
- `Equipes`
- `Meu plano`

## 5. Fluxo recomendado de uso (padrao de operacao)
1. Criar projeto em `Projetos`.
2. Estruturar escopo em `EAP` (niveis, datas, dependencias, responsaveis).
3. Executar tarefas em `Kanban`.
4. Acompanhar prazos no `Cronograma`.
5. Controlar custos no `Orcamento`.
6. Centralizar arquivos em `Documentos`.
7. Medir desempenho em `Relatorios`.
8. Ajustar equipe e permissoes em `Equipes`.
9. Se necessario, automatizar via `Integracoes`.

## 6. Modulos

### 6.1 Organizacoes
Use para:
- Selecionar a organizacao ativa.
- Criar ou editar organizacao (perfis autorizados).
- Controlar contexto de trabalho multi-organizacao.

Boas praticas:
- Sempre confirmar organizacao antes de editar dados.
- Evitar alteracoes administrativas sem validacao interna.

### 6.2 Dashboard
Use para:
- Ver visao macro dos projetos.
- Acompanhar indicadores de status e progresso.
- Entrar rapidamente nos modulos operacionais.

### 6.3 Projetos
Use para:
- Criar novo projeto.
- Filtrar por status, prioridade, cliente e responsavel.
- Alternar visualizacao em cards/tabela.
- Acompanhar capacidade da organizacao (plano e limite de projetos).

### 6.4 EAP
Use para:
- Montar a Estrutura Analitica do Projeto.
- Criar niveis pai/filho.
- Definir responsavel, status, prioridade, datas e quantidade de dias.
- Configurar dependencias entre tarefas.
- Recalcular datas com base em dependencias (botao `Recarregar`).

Regras importantes:
- Niveis pai funcionam como consolidacao (resumo dos filhos).
- Tarefas sem filhos sao unidades de execucao.
- Dependencia deve refletir ordem real de trabalho.

Checklist rapido na EAP:
1. Validar hierarquia de niveis.
2. Confirmar dependencias.
3. Conferir inicio/termino apos recalculo.
4. Confirmar responsavel em cada tarefa executavel.

### 6.5 Kanban
Use para:
- Operar o dia a dia das tarefas por status.
- Mover cards entre colunas.
- Acompanhar prioridades, prazos e responsaveis.

Boas praticas:
- Manter status atualizado diariamente.
- Evitar card sem responsavel em atividade critica.
- Revisar cards em atraso no inicio do dia.

### 6.6 Cronograma
Use para:
- Visualizar timeline de execucao.
- Identificar conflito de datas e concentracao de entregas.

### 6.7 Diagrama
Use para:
- Visualizar relacoes de fluxo e estrutura de planejamento.

### 6.8 Orcamento
Use para:
- Definir valor do projeto, contingencia e observacoes.
- Cadastrar itens de custo por categoria.
- Salvar alteracoes e conferir persistencia.

Validacao recomendada:
1. Salvar alteracoes.
2. Recarregar pagina (F5).
3. Confirmar que valores permanecem.

### 6.9 Documentos
Use para:
- Organizar anexos e evidencias do projeto.
- Buscar, baixar e acompanhar arquivos por contexto.

### 6.10 Relatorios
Use para:
- Acompanhar percentual concluido por projeto.
- Comparar escopo previsto x executado.
- Visualizar carteira (andamento, planejados, finalizados).
- Exportar/compartilhar resultados quando necessario.

### 6.11 Equipes
Use para:
- Convidar membros.
- Definir papel do usuario.
- Ajustar permissoes por modulo.
- Distribuir acesso por organizacao.

Recomendacao de seguranca:
- Liberar apenas o minimo necessario por pessoa.
- Revisar permissoes periodicamente.

### 6.12 Integracoes e webhooks
Use para:
- Emitir tokens de API.
- Cadastrar webhooks de saida.
- Testar entregas e acompanhar falhas.
- Integrar Slack, Google Calendar e alertas por e-mail.
- Importar EAP, catalogo, Trello e Jira.

Fluxo recomendado:
1. Criar token por integracao.
2. Configurar webhook/servico destino.
3. Testar envio.
4. Monitorar trilha de entregas.
5. Corrigir falhas e reenviar.

Observacoes:
- Teste de Slack depende de webhook real valido.
- Teste de e-mail depende de SMTP configurado.

### 6.13 Meu plano
Use para:
- Ver plano ativo.
- Conferir limite de projetos/recursos.
- Gerenciar faturamento conforme permissao.

## 7. Boas praticas operacionais
- Sempre trabalhar com organizacao e projeto corretos no cabecalho.
- Atualizar status e datas com disciplina.
- Revisar itens em atraso diariamente.
- Usar filtros para foco por equipe, nivel e responsavel.
- Registrar alteracoes relevantes (auditoria e rastreabilidade).

## 8. Problemas comuns e solucao

### 8.1 Nao consigo editar uma tela
Causa provavel: permissao insuficiente.
Acao:
1. Verifique seu papel em `Equipes`.
2. Solicite ajuste para OWNER/ADMIN.

### 8.2 Teste Slack falha
Causa provavel: webhook invalido ou indisponivel.
Acao:
1. Confirmar URL `https://hooks.slack.com/...`.
2. Testar novamente pela Central de Integracoes.

### 8.3 Teste de e-mail falha
Causa provavel: SMTP nao configurado.
Acao:
1. Validar configuracoes SMTP no backend.
2. Repetir teste de alertas por e-mail.

### 8.4 Datas da EAP nao batem com dependencia
Causa provavel: dependencia incorreta ou sem recalc.
Acao:
1. Revisar predecessora correta.
2. Clicar em `Recarregar`.
3. Conferir quantidade de dias e datas finais.

## 9. Checklist de uso diario (sugestao)
1. Abrir Dashboard e identificar riscos.
2. Revisar EAP (dependencias e datas criticas).
3. Atualizar Kanban (status real).
4. Conferir orcamento e desvios.
5. Registrar documentos/decisoes do dia.

## 10. Canais internos de suporte
Defina e publique no seu ambiente:
- Responsavel funcional do sistema
- Responsavel tecnico (integracoes/performance)
- Canal de atendimento (e-mail, chat ou service desk)

---
Se quiser, posso gerar a proxima versao deste manual em formato "Guia rapido" (1 pagina) para onboarding de novos usuarios.
