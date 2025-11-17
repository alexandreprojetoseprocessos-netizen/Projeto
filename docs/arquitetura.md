# Arquitetura da Plataforma G&P

## Visão Geral
- **Frontend (apps/front)**: React + Vite + Supabase Realtime para dashboards, Kanban e Gantt.
- **API (apps/api)**: Node.js + Express + Prisma. Orquestra integrações (Supabase, GitHub, Slack, etc.).
- **Database (apps/database)**: Prisma schema conectado ao Supabase/PostgreSQL.

## Integrações
| Serviço | Uso |
| --- | --- |
| Supabase Auth | Login, permissões, tokens |
| Supabase Storage | Anexos e documentos |
| GitHub API | Commits, PRs, CI/CD |
| Slack / Teams | Notificações |
| Google/Outlook Calendar | Prazos e marcos |
| SendGrid/SMTP | E-mails |

## Módulos principais
1. **Autenticação**: SSO, 2FA, RBAC.
2. **Projetos**: CRUD, WBS, Kanban, Gantt, dependências.
3. **Equipe**: papéis, disponibilidade, convites.
4. **Relatórios**: produtividade, financeiro, exportações.
5. **Configurações**: organização, integrações, templates.

## Git e Deploy
- Monorepo com workspaces.
- Branches `main`, `dev`, `feature/*`, `hotfix/*`.
- GitHub Actions para lint/test/build/deploy.
- Docker Compose orquestra API, frontend e banco local.
