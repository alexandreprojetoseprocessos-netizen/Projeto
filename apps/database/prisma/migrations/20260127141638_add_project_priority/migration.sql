-- AlterTable
ALTER TABLE "Invite" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM';
