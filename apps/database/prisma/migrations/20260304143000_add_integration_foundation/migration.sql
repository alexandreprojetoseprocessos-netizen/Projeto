CREATE TYPE "IntegrationProvider" AS ENUM (
  'CUSTOM',
  'SLACK',
  'GOOGLE_CALENDAR',
  'OUTLOOK_CALENDAR',
  'TRELLO',
  'ASANA',
  'JIRA',
  'GITHUB'
);

CREATE TYPE "WebhookDeliveryStatus" AS ENUM (
  'PENDING',
  'SUCCESS',
  'FAILED'
);

CREATE TABLE "ApiToken" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "createdById" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "tokenPrefix" TEXT NOT NULL,
  "tokenLastFour" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "scopes" JSONB,
  "lastUsedAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ApiToken_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WebhookSubscription" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "createdById" TEXT NOT NULL,
  "provider" "IntegrationProvider" NOT NULL DEFAULT 'CUSTOM',
  "name" TEXT NOT NULL,
  "targetUrl" TEXT NOT NULL,
  "secret" TEXT NOT NULL,
  "eventNames" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "lastTriggeredAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "WebhookSubscription_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WebhookDelivery" (
  "id" TEXT NOT NULL,
  "subscriptionId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "eventName" TEXT NOT NULL,
  "requestId" TEXT NOT NULL,
  "status" "WebhookDeliveryStatus" NOT NULL DEFAULT 'PENDING',
  "attemptCount" INTEGER NOT NULL DEFAULT 1,
  "payload" JSONB NOT NULL,
  "responseStatus" INTEGER,
  "responseBody" TEXT,
  "errorMessage" TEXT,
  "deliveredAt" TIMESTAMP(3),
  "lastAttemptAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "WebhookDelivery_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "IntegrationImportJob" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "createdById" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "entity" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "fileName" TEXT,
  "summary" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "IntegrationImportJob_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ApiToken_tokenHash_key" ON "ApiToken"("tokenHash");
CREATE INDEX "ApiToken_organizationId_revokedAt_idx" ON "ApiToken"("organizationId", "revokedAt");
CREATE INDEX "WebhookSubscription_organizationId_isActive_idx" ON "WebhookSubscription"("organizationId", "isActive");
CREATE INDEX "WebhookDelivery_organizationId_createdAt_idx" ON "WebhookDelivery"("organizationId", "createdAt");
CREATE INDEX "WebhookDelivery_subscriptionId_status_idx" ON "WebhookDelivery"("subscriptionId", "status");
CREATE INDEX "IntegrationImportJob_organizationId_createdAt_idx" ON "IntegrationImportJob"("organizationId", "createdAt");

ALTER TABLE "ApiToken"
ADD CONSTRAINT "ApiToken_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ApiToken"
ADD CONSTRAINT "ApiToken_createdById_fkey"
FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WebhookSubscription"
ADD CONSTRAINT "WebhookSubscription_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WebhookSubscription"
ADD CONSTRAINT "WebhookSubscription_createdById_fkey"
FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WebhookDelivery"
ADD CONSTRAINT "WebhookDelivery_subscriptionId_fkey"
FOREIGN KEY ("subscriptionId") REFERENCES "WebhookSubscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WebhookDelivery"
ADD CONSTRAINT "WebhookDelivery_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "IntegrationImportJob"
ADD CONSTRAINT "IntegrationImportJob_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "IntegrationImportJob"
ADD CONSTRAINT "IntegrationImportJob_createdById_fkey"
FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
