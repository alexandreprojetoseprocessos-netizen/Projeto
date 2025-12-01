-- CreateEnum
CREATE TYPE "OrganizationStatus" AS ENUM ('ACTIVE', 'DEACTIVATED', 'SOFT_DELETED');

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "status" "OrganizationStatus" NOT NULL DEFAULT 'ACTIVE';
