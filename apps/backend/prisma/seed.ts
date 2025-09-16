import { PrismaClient } from '@prisma/client';
import { seedHospitals } from './seed-hospitals';
import { seedUsers } from './seed-users';
import { seedCriticalCases } from './seed-critical-cases-simple';
import { seedComprehensiveCases } from './seed-comprehensive-cases';
import { seedStrokeKpiTest } from './seed-stroke-kpi';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting comprehensive data seeding (preserving existing data)...');

  // Check existing data
  const existingHospitals = await prisma.hospital.count();
  const existingUsers = await prisma.user.count();
  const existingCriticalCases = await prisma.criticalCase.count();

  console.log(`📊 Existing data found:`);
  console.log(`   - Hospitals: ${existingHospitals}`);
  console.log(`   - Users: ${existingUsers}`);
  console.log(`   - Critical Cases: ${existingCriticalCases}`);

  // Only seed if no data exists
  if (existingHospitals === 0) {
    console.log('🏥 No hospitals found, seeding hospitals...');
    await seedHospitals();
  } else {
    console.log('🏥 Hospitals already exist, skipping hospital seeding');
  }
  
  if (existingUsers === 0) {
    console.log('👥 No users found, seeding users...');
    await seedUsers();
  } else {
    console.log('👥 Users already exist, skipping user seeding');
  }
  
  if (existingCriticalCases === 0) {
    console.log('🚨 No critical cases found, seeding critical cases...');
    await seedCriticalCases();
  } else {
    console.log('🚨 Critical cases already exist, skipping critical case seeding');
  }

  // Always run comprehensive case seeding for testing
  console.log('🚨 Running comprehensive case seeding...');
  await seedComprehensiveCases();

  // Always run stroke KPI test seed for comprehensive testing
  console.log('🧠 Running stroke KPI test seed...');
  await seedStrokeKpiTest();

  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
