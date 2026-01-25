import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Applying invitation fields migration...');
  
  try {
    // Add invitation fields to User table
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "inviteToken" TEXT;
    `);
    console.log('Added inviteToken column');
    
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "inviteTokenExpiry" TIMESTAMP(3);
    `);
    console.log('Added inviteTokenExpiry column');
    
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "invitedById" TEXT;
    `);
    console.log('Added invitedById column');
    
    // Create unique index on inviteToken
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "User_inviteToken_key" ON "User"("inviteToken");
    `);
    console.log('Created unique index on inviteToken');
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
