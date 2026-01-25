-- Add invitation fields to User table
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "inviteToken" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "inviteTokenExpiry" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "invitedById" TEXT;

-- Create unique index on inviteToken
CREATE UNIQUE INDEX IF NOT EXISTS "User_inviteToken_key" ON "User"("inviteToken");
