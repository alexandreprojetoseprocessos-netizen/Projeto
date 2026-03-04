ALTER TABLE "IntegrationConnection" ADD COLUMN "accessToken" TEXT;
CREATE UNIQUE INDEX "IntegrationConnection_accessToken_key" ON "IntegrationConnection"("accessToken");
