-- AlterTable (idempotent)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'ServiceCatalog' AND column_name = 'updatedAt'
  ) THEN
    ALTER TABLE "ServiceCatalog" ALTER COLUMN "updatedAt" DROP DEFAULT;
  END IF;
END $$;

-- AddForeignKey (idempotent)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'WbsNode' AND column_name = 'serviceCatalogId'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE constraint_name = 'WbsNode_serviceCatalogId_fkey'
  ) THEN
    ALTER TABLE "WbsNode"
      ADD CONSTRAINT "WbsNode_serviceCatalogId_fkey"
      FOREIGN KEY ("serviceCatalogId") REFERENCES "ServiceCatalog"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
