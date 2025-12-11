-- Ensure ServiceCatalog exists (idempotent for shadow DB)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'ServiceCatalog'
    ) THEN
        CREATE TABLE "ServiceCatalog" (
            "id" TEXT NOT NULL,
            "projectId" TEXT NOT NULL,
            "name" TEXT NOT NULL,
            "description" TEXT,
            "hoursBase" DOUBLE PRECISION NOT NULL,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT "ServiceCatalog_pkey" PRIMARY KEY ("id")
        );
        ALTER TABLE "ServiceCatalog"
          ADD CONSTRAINT "ServiceCatalog_projectId_fkey"
          FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AlterTable
ALTER TABLE "WbsNode" ADD COLUMN     "serviceCatalogId" TEXT;
ALTER TABLE "WbsNode" ADD COLUMN     "serviceMultiplier" DOUBLE PRECISION;
ALTER TABLE "WbsNode" ADD COLUMN     "serviceHours" DOUBLE PRECISION;

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.constraint_column_usage
        WHERE constraint_name = 'WbsNode_serviceCatalogId_fkey'
    ) THEN
        ALTER TABLE "WbsNode"
          ADD CONSTRAINT "WbsNode_serviceCatalogId_fkey"
          FOREIGN KEY ("serviceCatalogId") REFERENCES "ServiceCatalog"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
