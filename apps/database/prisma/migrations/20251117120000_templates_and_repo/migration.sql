-- Add repository URL column to projects
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "repositoryUrl" TEXT;

-- Templates to persist dashboard configurations
CREATE TABLE "ProjectTemplate" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "clientName" TEXT,
  "repositoryUrl" TEXT,
  "budget" DECIMAL(14,2),
  "columns" JSONB NOT NULL,
  "wbs" JSONB NOT NULL,
  "customFields" JSONB NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "ProjectTemplate_organizationId_name_key"
  ON "ProjectTemplate" ("organizationId", "name");

ALTER TABLE "ProjectTemplate"
  ADD CONSTRAINT "ProjectTemplate_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
