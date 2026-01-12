import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seed() {
  console.log('🌱 Seeding database...');
  
  // Seed default role rates
  const roleRates = [
    { role: 'Admin', rateCents: 15000 }, // $150/hr
    { role: 'Attorney', rateCents: 35000 }, // $350/hr
    { role: 'Paralegal', rateCents: 15000 }, // $150/hr
    { role: 'Legal Assistant', rateCents: 10000 }, // $100/hr
    { role: 'Staff', rateCents: 7500 } // $75/hr
  ];
  
  for (const rate of roleRates) {
    await prisma.roleRate.upsert({
      where: { role: rate.role },
      update: { rateCents: rate.rateCents },
      create: rate
    });
  }
  console.log('✅ Role rates seeded');
  
  // Seed default billing codes
  const billingCodes = [
    { code: '001', label: 'Legal Research', rateSource: 'roleRate', active: true },
    { code: '002', label: 'Document Review', rateSource: 'roleRate', active: true },
    { code: '003', label: 'Client Communication', rateSource: 'roleRate', active: true },
    { code: '004', label: 'Court Appearance', rateSource: 'roleRate', active: true },
    { code: '005', label: 'Drafting', rateSource: 'roleRate', active: true },
    { code: '006', label: 'Case Strategy', rateSource: 'roleRate', active: true },
    { code: '007', label: 'Administrative', rateSource: 'fixedRate', fixedRateCents: 5000, active: true },
    { code: '008', label: 'Travel Time', rateSource: 'fixedRate', fixedRateCents: 10000, active: true }
  ];
  
  for (const code of billingCodes) {
    await prisma.billingCode.upsert({
      where: { code: code.code },
      update: code,
      create: code
    });
  }
  console.log('✅ Billing codes seeded');
  
  console.log('🎉 Seeding complete!');
}

seed()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
