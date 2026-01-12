import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const email = 'dylan.barrett@embeddedcounsel.com';
  const newPassword = 'LegalTrack2026!';

  // Hash password
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // Update user password
  const user = await prisma.user.update({
    where: { email },
    data: {
      password: hashedPassword
    }
  });

  console.log('✅ Admin password reset successfully!');
  console.log('Email:', email);
  console.log('New Password:', newPassword);
  console.log('User ID:', user.id);
}

main()
  .catch((e) => {
    console.error('Error resetting password:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
