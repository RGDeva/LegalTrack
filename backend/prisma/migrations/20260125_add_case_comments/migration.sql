-- Create CaseComment table
CREATE TABLE IF NOT EXISTS "CaseComment" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "comment" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CaseComment_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "CaseComment_caseId_idx" ON "CaseComment"("caseId");
CREATE INDEX IF NOT EXISTS "CaseComment_userId_idx" ON "CaseComment"("userId");
CREATE INDEX IF NOT EXISTS "CaseComment_createdAt_idx" ON "CaseComment"("createdAt");

-- Add foreign key constraints
ALTER TABLE "CaseComment" ADD CONSTRAINT "CaseComment_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CaseComment" ADD CONSTRAINT "CaseComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
