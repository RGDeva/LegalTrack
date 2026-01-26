import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Applying CaseComment migration...');
  
  try {
    // Create CaseComment table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "CaseComment" (
        "id" TEXT NOT NULL,
        "caseId" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "comment" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "CaseComment_pkey" PRIMARY KEY ("id")
      );
    `);
    console.log('Created CaseComment table');
    
    // Create indexes
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "CaseComment_caseId_idx" ON "CaseComment"("caseId");
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "CaseComment_userId_idx" ON "CaseComment"("userId");
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "CaseComment_createdAt_idx" ON "CaseComment"("createdAt");
    `);
    console.log('Created indexes');
    
    // Add foreign key constraints (ignore if already exists)
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "CaseComment" ADD CONSTRAINT "CaseComment_caseId_fkey" 
        FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      `);
    } catch (e) {
      console.log('caseId foreign key already exists or error:', e.message);
    }
    
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "CaseComment" ADD CONSTRAINT "CaseComment_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
      `);
    } catch (e) {
      console.log('userId foreign key already exists or error:', e.message);
    }
    
    console.log('CaseComment migration completed successfully!');
  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
