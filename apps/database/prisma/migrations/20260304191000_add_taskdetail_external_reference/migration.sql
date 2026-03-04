ALTER TABLE "TaskDetail"
ADD COLUMN "externalSource" TEXT,
ADD COLUMN "externalKey" TEXT;

CREATE UNIQUE INDEX "TaskDetail_externalSource_externalKey_key"
ON "TaskDetail"("externalSource", "externalKey");
