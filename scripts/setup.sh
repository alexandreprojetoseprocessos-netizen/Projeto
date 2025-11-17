#!/usr/bin/env bash
set -euo pipefail

echo "==> Instalando dependências"
npm install

echo "==> Gerando Prisma client"
npm run --workspace apps/database generate

echo "==> Executando migrations"
npm run --workspace apps/database migrate:dev -- --name init

