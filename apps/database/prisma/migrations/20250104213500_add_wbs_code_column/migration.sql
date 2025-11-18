-- Add the WBS code column so numbering can be stored persistently
ALTER TABLE "WbsNode"
ADD COLUMN IF NOT EXISTS "wbsCode" TEXT;
