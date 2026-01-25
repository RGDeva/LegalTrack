import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function applyMigration() {
  try {
    console.log('Applying notification system migration...');

    // Add columns to User table
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "emailNotifications" BOOLEAN NOT NULL DEFAULT true;
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "notifyInvoices" BOOLEAN NOT NULL DEFAULT true;
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "notifyDeadlines" BOOLEAN NOT NULL DEFAULT true;
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "notifyTasks" BOOLEAN NOT NULL DEFAULT true;
    `);

    console.log('✓ Added notification preferences to User table');

    // Create NotificationLog table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "NotificationLog" (
        "id" TEXT NOT NULL,
        "userId" TEXT,
        "recipientEmail" TEXT NOT NULL,
        "recipientName" TEXT,
        "type" TEXT NOT NULL,
        "subject" TEXT NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'sent',
        "metadata" JSONB,
        "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "NotificationLog_pkey" PRIMARY KEY ("id")
      );
    `);

    console.log('✓ Created NotificationLog table');

    // Create indexes
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "NotificationLog_userId_idx" ON "NotificationLog"("userId");
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "NotificationLog_type_idx" ON "NotificationLog"("type");
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "NotificationLog_status_idx" ON "NotificationLog"("status");
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "NotificationLog_sentAt_idx" ON "NotificationLog"("sentAt");
    `);

    console.log('✓ Created indexes');

    // Add foreign key constraint
    await prisma.$executeRawUnsafe(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'NotificationLog_userId_fkey'
        ) THEN
          ALTER TABLE "NotificationLog" ADD CONSTRAINT "NotificationLog_userId_fkey" 
            FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
        END IF;
      END $$;
    `);

    console.log('✓ Added foreign key constraint');
    console.log('✅ Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

applyMigration();
