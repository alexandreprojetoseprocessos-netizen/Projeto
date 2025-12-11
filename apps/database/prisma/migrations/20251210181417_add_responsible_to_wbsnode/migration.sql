-- AlterTable
ALTER TABLE "WbsNode" ADD COLUMN     "responsibleMembershipId" TEXT;

-- AddForeignKey
ALTER TABLE "WbsNode" ADD CONSTRAINT "WbsNode_responsibleMembershipId_fkey" FOREIGN KEY ("responsibleMembershipId") REFERENCES "OrganizationMembership"("id") ON DELETE SET NULL ON UPDATE CASCADE;
