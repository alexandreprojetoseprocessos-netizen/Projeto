# 🧭 G&P — Sistema de Gestão de Projetos

Monorepositório que reúne API, frontend e camada de banco (Prisma) para a plataforma de gestão de projetos profissionais integrada ao Supabase e GitHub.

## Estrutura

```
gestao-projetos/
├── apps/
│   ├── api/        # Node.js + Express + Prisma Client
│   ├── front/      # React + Vite + Supabase client
│   └── database/   # Prisma schema, migrations e seeds
├── docs/           # Documentação funcional/técnica
├── scripts/        # Automação (deploy, seed, backups)
├── .env.example    # Variáveis necessárias
├── docker-compose.yml
└── README.md
```

## Requisitos
- Node.js >= 20
- NPM ou PNPM
- Supabase project configurado

## Instalação

```bash
npm install
```

## Desenvolvimento

```bash
npm run dev:api     # API em http://localhost:4000
npm run dev:front   # Frontend em http://localhost:5173
```

## Banco de dados / Prisma

```bash
npm run --workspace apps/database migrate:dev
npm run --workspace apps/database seed
```

## Variáveis de ambiente
Consulte `.env.example` e crie `.env` na raiz. Para execução local com Docker, configure `DATABASE_URL` para apontar ao serviço do compose.

## Fluxo GitHub
- `main`: produção
- `dev`: testes / homologação
- `feature/*`: novas funcionalidades
- `hotfix/*`: correções urgentes

Pull requests devem validar lint, testes e build via GitHub Actions.

## Roadmap imediato
1. Implementar autenticação (Supabase Auth) e rotas principais.
2. Construir dashboards e módulos de projeto/tarefas.
3. Integrar GitHub API para sincronizar commits/PRs.
4. Adicionar pipelines CI/CD.
