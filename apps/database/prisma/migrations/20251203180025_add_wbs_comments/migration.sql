-- CreateTable
CREATE TABLE "WbsComment" (
    "id" TEXT NOT NULL,
    "wbsNodeId" TEXT NOT NULL,
    "authorId" TEXT,
    "authorName" TEXT,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WbsComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WbsComment_wbsNodeId_idx" ON "WbsComment"("wbsNodeId");

-- AddForeignKey
ALTER TABLE "WbsComment" ADD CONSTRAINT "WbsComment_wbsNodeId_fkey" FOREIGN KEY ("wbsNodeId") REFERENCES "WbsNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;
