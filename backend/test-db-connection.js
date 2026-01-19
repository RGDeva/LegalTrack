import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function testConnection() {
  console.log('Testing database connection...');
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set (hidden)' : 'NOT SET');
  
  try {
    // Try to connect and query
    await prisma.$connect();
    console.log('✅ Database connected successfully!');
    
    // Try a simple query
    const userCount = await prisma.user.count();
    console.log(`✅ Found ${userCount} users in database`);
    
    // Check if admin user exists (if ADMIN_EMAIL is set)
    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail) {
      const admin = await prisma.user.findFirst({
        where: { email: adminEmail }
      });
      
      if (admin) {
        console.log('✅ Admin user exists');
      } else {
        console.log('⚠️  Admin user not found');
      }
    } else {
      console.log('ℹ️  ADMIN_EMAIL not set, skipping admin check');
    }
    
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error(error.message);
    
    if (error.message.includes("Can't reach database server")) {
      console.log('\n💡 Possible solutions:');
      console.log('1. Database might be paused (Neon free tier pauses after inactivity)');
      console.log('2. Check DATABASE_URL in Railway environment variables');
      console.log('3. Verify database is running in Neon dashboard');
      console.log('4. Check if IP is whitelisted (if using IP restrictions)');
    }
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
