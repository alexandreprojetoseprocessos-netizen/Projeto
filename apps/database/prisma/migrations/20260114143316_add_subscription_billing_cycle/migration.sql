/*
  Warnings:

  - A unique constraint covering the columns `[mpPaymentId]` on the table `Subscription` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[corporateEmail]` on the table `User` will be added. If there are existing duplicate values, this will fail.
*/
-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('CPF', 'CNPJ');

-- CreateEnum
CREATE TYPE "InviteStatus" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED');

-- CreateEnum
CREATE TYPE "BillingCycle" AS ENUM ('MONTHLY', 'ANNUAL');

-- =========================================
-- Subscription: adicionar colunas sem quebrar linhas existentes
-- =========================================

-- 1) Adiciona colunas novas (updatedAt como NULL primeiro)
ALTER TABLE "Subscription"
  ADD COLUMN IF NOT EXISTS "billingCycle" "BillingCycle" NOT NULL DEFAULT 'MONTHLY',
  ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "currentPeriodEnd" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "mpCustomerId" TEXT,
  ADD COLUMN IF NOT EXISTS "mpPreferenceId" TEXT,
  ADD COLUMN IF NOT EXISTS "mpSubscriptionId" TEXT,
  ADD COLUMN IF NOT EXISTS "mpPaymentId" TEXT,
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3);

-- 2) Ajusta defaults e campos antigos
ALTER TABLE "Subscription"
  ALTER COLUMN "status" SET DEFAULT 'PENDING',
  ALTER COLUMN "startedAt" DROP NOT NULL,
  ALTER COLUMN "startedAt" DROP DEFAULT;

-- 3) Popula updatedAt nas linhas existentes e trava NOT NULL
UPDATE "Subscription"
SET "updatedAt" = COALESCE("updatedAt", NOW())
WHERE "updatedAt" IS NULL;

ALTER TABLE "Subscription"
  ALTER COLUMN "updatedAt" SET NOT NULL;

-- =========================================
-- User: adicionar campos
-- =========================================
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "corporateEmail" TEXT,
  ADD COLUMN IF NOT EXISTS "documentNumber" TEXT,
  ADD COLUMN IF NOT EXISTS "documentType" "DocumentType",
  ADD COLUMN IF NOT EXISTS "personalEmail" TEXT;

-- =========================================
-- Invite: criar tabela (updatedAt com DEFAULT para não travar)
-- =========================================
CREATE TABLE IF NOT EXISTS "Invite" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  "status" "InviteStatus" NOT NULL DEFAULT 'PENDING',
  "role" "MembershipRole" NOT NULL DEFAULT 'MEMBER',
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "acceptedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  "createdById" TEXT,
  "acceptedById" TEXT,

  CONSTRAINT "Invite_pkey" PRIMARY KEY ("id")
);

-- Indexes Invite
CREATE UNIQUE INDEX IF NOT EXISTS "Invite_token_key" ON "Invite"("token");
CREATE INDEX IF NOT EXISTS "Invite_organizationId_status_idx" ON "Invite"("organizationId", "status");
CREATE INDEX IF NOT EXISTS "Invite_email_idx" ON "Invite"("email");

-- =========================================
-- Uniques: limpar duplicados antes (se existirem) e criar index
-- =========================================

-- Subscription.mpPaymentId unique (ignora NULLs, limpa duplicados)
WITH dup AS (
  SELECT "mpPaymentId"
  FROM "Subscription"
  WHERE "mpPaymentId" IS NOT NULL
  GROUP BY "mpPaymentId"
  HAVING COUNT(*) > 1
),
to_null AS (
  SELECT s."id"
  FROM "Subscription" s
  JOIN dup d ON d."mpPaymentId" = s."mpPaymentId"
  ORDER BY s."createdAt" DESC NULLS LAST
  OFFSET 1
)
UPDATE "Subscription" s
SET "mpPaymentId" = NULL
WHERE s."id" IN (SELECT "id" FROM to_null);

CREATE UNIQUE INDEX IF NOT EXISTS "Subscription_mpPaymentId_key"
ON "Subscription"("mpPaymentId");

-- User.corporateEmail unique (limpa duplicados, normaliza)
-- (opcional) normaliza email pra minúsculo antes
UPDATE "User"
SET "corporateEmail" = LOWER("corporateEmail")
WHERE "corporateEmail" IS NOT NULL;

WITH dup_email AS (
  SELECT "corporateEmail"
  FROM "User"
  WHERE "corporateEmail" IS NOT NULL
  GROUP BY "corporateEmail"
  HAVING COUNT(*) > 1
),
to_null_email AS (
  SELECT u."id"
  FROM "User" u
  JOIN dup_email d ON d."corporateEmail" = u."corporateEmail"
  ORDER BY u."createdAt" DESC NULLS LAST
  OFFSET 1
)
UPDATE "User" u
SET "corporateEmail" = NULL
WHERE u."id" IN (SELECT "id" FROM to_null_email);

CREATE UNIQUE INDEX IF NOT EXISTS "User_corporateEmail_key"
ON "User"("corporateEmail");

-- =========================================
-- Foreign keys Invite
-- =========================================
ALTER TABLE "Invite"
  ADD CONSTRAINT "Invite_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Invite"
  ADD CONSTRAINT "Invite_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Invite"
  ADD CONSTRAINT "Invite_acceptedById_fkey"
  FOREIGN KEY ("acceptedById") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
