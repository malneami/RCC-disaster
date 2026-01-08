
import { seedBeds } from './seed-beds';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting standalone bed seeding...');
  await seedBeds();
  console.log('✅ Standalone bed seeding completed.');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding beds:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
