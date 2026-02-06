-- Add RunsheetComment table for per-entry comment threads
CREATE TABLE IF NOT EXISTS "RunsheetComment" (
    "id" TEXT NOT NULL,
    "runsheetEntryId" TEXT NOT NULL,
    "parentId" TEXT,
    "userId" TEXT NOT NULL,
    "userName" TEXT,
    "comment" TEXT NOT NULL,
    "mentions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RunsheetComment_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "RunsheetComment_runsheetEntryId_fkey" FOREIGN KEY ("runsheetEntryId") REFERENCES "RunsheetEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "RunsheetComment_runsheetEntryId_idx" ON "RunsheetComment"("runsheetEntryId");
CREATE INDEX IF NOT EXISTS "RunsheetComment_parentId_idx" ON "RunsheetComment"("parentId");
CREATE INDEX IF NOT EXISTS "RunsheetComment_userId_idx" ON "RunsheetComment"("userId");

-- Add dependsOnId to Subtask for dependency locking
ALTER TABLE "Subtask" ADD COLUMN IF NOT EXISTS "dependsOnId" TEXT;

-- Add Google source ID and sync direction to Contact
ALTER TABLE "Contact" ADD COLUMN IF NOT EXISTS "googleSourceId" TEXT;
ALTER TABLE "Contact" ADD COLUMN IF NOT EXISTS "googleSyncDirection" TEXT DEFAULT 'one_way';
