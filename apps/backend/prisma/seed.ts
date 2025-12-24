import { PrismaClient } from '@prisma/client';
import { seedHospitals } from './seed-hospitals';
import { seedUsers } from './seed-users';
import { seedBeds } from './seed-beds';
import { seedCriticalCases } from './seed-critical-cases-simple';
import { seedComprehensiveCases } from './seed-comprehensive-cases';
import { seedStrokeKpiTest } from './seed-stroke-kpi';
import { seedComprehensiveStemiCases } from './seed-comprehensive-stemi';
import { seedComprehensiveStrokeCases } from './seed-comprehensive-stroke';
import { seedComprehensiveTraumaCases } from './seed-comprehensive-trauma';
import seedEMSData from './seed-ems-data';
import seedAmbulances from './seed-ambulances';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting comprehensive data seeding (preserving existing data)...');

  // Check existing data
  const existingHospitals = await prisma.hospital.count();
  const existingUsers = await prisma.user.count();
  const existingCriticalCases = await prisma.criticalCase.count();
  const existingAmbulances = await prisma.ambulance.count();

  console.log(`📊 Existing data found:`);
  console.log(`   - Hospitals: ${existingHospitals}`);
  console.log(`   - Users: ${existingUsers}`);
  console.log(`   - Critical Cases: ${existingCriticalCases}`);
  console.log(`   - Ambulances: ${existingAmbulances}`);

  // Only seed if no data exists
  if (existingHospitals === 0) {
    console.log('🏥 No hospitals found, seeding hospitals...');
    await seedHospitals();
  } else {
    console.log('🏥 Hospitals already exist, skipping hospital seeding');
  }
  
  console.log('🛏️  Running bed migration (converting aggregated counts to individual beds)...');
  await seedBeds();
  
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

  // Run comprehensive STEMI cases
  console.log('❤️ Running comprehensive STEMI case seeding...');
  await seedComprehensiveStemiCases();

  // Run comprehensive Stroke cases
  console.log('🧠 Running comprehensive Stroke case seeding...');
  await seedComprehensiveStrokeCases();

  // Run comprehensive Trauma cases
  console.log('🚑 Running comprehensive Trauma case seeding...');
  await seedComprehensiveTraumaCases();

  // Always run stroke KPI test seed for comprehensive testing
  console.log('🧠 Running stroke KPI test seed...');
  await seedStrokeKpiTest();

  // Seed EMS data (drivers, ambulances, etc.)
  if (existingAmbulances === 0) {
    console.log('🚑 No ambulances found, seeding ambulances...');
    await seedAmbulances();
  } else {
    console.log('🚑 Ambulances already exist, skipping ambulance seeding');
  }

  // Always run EMS data seeding (includes drivers and other EMS-related data)
  console.log('🚨 Running EMS data seeding...');
  await seedEMSData();

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
