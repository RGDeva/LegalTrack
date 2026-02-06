-- Add 2FA and Google integration fields to User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "twoFactorSecret" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "googleRefreshToken" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "googleAccessToken" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "googleTokenExpiry" TIMESTAMP(3);

-- Add Google Drive and custom fields to Case
ALTER TABLE "Case" ADD COLUMN IF NOT EXISTS "googleDriveFolderId" TEXT;
ALTER TABLE "Case" ADD COLUMN IF NOT EXISTS "customFields" JSONB;

-- Add Google sync and lead fields to Contact
ALTER TABLE "Contact" ADD COLUMN IF NOT EXISTS "googleContactId" TEXT;
ALTER TABLE "Contact" ADD COLUMN IF NOT EXISTS "googleSyncedAt" TIMESTAMP(3);
ALTER TABLE "Contact" ADD COLUMN IF NOT EXISTS "isLead" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Contact" ADD COLUMN IF NOT EXISTS "leadSource" TEXT;
ALTER TABLE "Contact" ADD COLUMN IF NOT EXISTS "leadCustomFields" JSONB;

-- Add indexes for Contact
CREATE INDEX IF NOT EXISTS "Contact_googleContactId_idx" ON "Contact"("googleContactId");
CREATE INDEX IF NOT EXISTS "Contact_isLead_idx" ON "Contact"("isLead");

-- Add order and completion fields to Task
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "orderIndex" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMP(3);

-- CreateTable Subtask
CREATE TABLE IF NOT EXISTS "Subtask" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "dueDate" TIMESTAMP(3),
    "taskId" TEXT NOT NULL,
    "assignedToId" TEXT,
    "createdById" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subtask_pkey" PRIMARY KEY ("id")
);

-- CreateTable SubtaskComment
CREATE TABLE IF NOT EXISTS "SubtaskComment" (
    "id" TEXT NOT NULL,
    "subtaskId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "comment" TEXT NOT NULL,
    "mentions" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubtaskComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable RunsheetEntry
CREATE TABLE IF NOT EXISTS "RunsheetEntry" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "userId" TEXT,
    "userName" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RunsheetEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable CaseFieldTemplate
CREATE TABLE IF NOT EXISTS "CaseFieldTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "caseType" TEXT NOT NULL,
    "fields" JSONB NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CaseFieldTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable LeadFormSubmission
CREATE TABLE IF NOT EXISTS "LeadFormSubmission" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "message" TEXT,
    "customFields" JSONB,
    "source" TEXT,
    "contactId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'new',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadFormSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Subtask_taskId_idx" ON "Subtask"("taskId");
CREATE INDEX IF NOT EXISTS "Subtask_status_idx" ON "Subtask"("status");
CREATE INDEX IF NOT EXISTS "Subtask_assignedToId_idx" ON "Subtask"("assignedToId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "SubtaskComment_subtaskId_idx" ON "SubtaskComment"("subtaskId");
CREATE INDEX IF NOT EXISTS "SubtaskComment_userId_idx" ON "SubtaskComment"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "RunsheetEntry_caseId_idx" ON "RunsheetEntry"("caseId");
CREATE INDEX IF NOT EXISTS "RunsheetEntry_type_idx" ON "RunsheetEntry"("type");
CREATE INDEX IF NOT EXISTS "RunsheetEntry_createdAt_idx" ON "RunsheetEntry"("createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CaseFieldTemplate_caseType_idx" ON "CaseFieldTemplate"("caseType");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "LeadFormSubmission_email_idx" ON "LeadFormSubmission"("email");
CREATE INDEX IF NOT EXISTS "LeadFormSubmission_status_idx" ON "LeadFormSubmission"("status");
CREATE INDEX IF NOT EXISTS "LeadFormSubmission_createdAt_idx" ON "LeadFormSubmission"("createdAt");

-- AddForeignKey
ALTER TABLE "Subtask" ADD CONSTRAINT "Subtask_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Subtask" ADD CONSTRAINT "Subtask_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Subtask" ADD CONSTRAINT "Subtask_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubtaskComment" ADD CONSTRAINT "SubtaskComment_subtaskId_fkey" FOREIGN KEY ("subtaskId") REFERENCES "Subtask"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SubtaskComment" ADD CONSTRAINT "SubtaskComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RunsheetEntry" ADD CONSTRAINT "RunsheetEntry_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;
