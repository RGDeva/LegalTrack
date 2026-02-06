import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

async function applyMigration() {
  try {
    console.log('🚀 Starting enhanced features migration...');
    
    const migrationPath = path.join(__dirname, 'prisma', 'migrations', '20260206_add_enhanced_features', 'migration.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split by semicolon and filter out empty statements
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      try {
        await prisma.$executeRawUnsafe(statement);
        console.log(`✅ Executed statement ${i + 1}/${statements.length}`);
      } catch (error) {
        // Ignore errors for IF NOT EXISTS statements
        if (error.message.includes('already exists') || error.message.includes('duplicate')) {
          console.log(`⚠️  Statement ${i + 1} already applied, skipping...`);
        } else {
          console.error(`❌ Error in statement ${i + 1}:`, error.message);
          throw error;
        }
      }
    }
    
    console.log('✅ Enhanced features migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

applyMigration();
