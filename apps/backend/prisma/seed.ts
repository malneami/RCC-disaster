import { PrismaClient } from '@prisma/client';
import { seedHospitals } from './seed-hospitals';
import { seedUsers } from './seed-users';
import { seedBeds } from './seed-beds';
import seedAmbulances from './seed-ambulances';
import seedEMSData from './seed-ems-data';
import { seedPatients } from './seed-patients';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting data seeding (hospitals, users, beds, ambulances, EMS data)...');

  // Seed hospitals first (required by users)
  console.log('🏥 Seeding hospitals...');
  await seedHospitals();
  
  // Seed users (requires hospitals)
  console.log('👥 Seeding users...');
  await seedUsers();

  // Seed beds (requires hospitals)
  console.log('🛏️  Seeding beds...');
  await seedBeds();
  
  // Seed ambulances
  console.log('🚑 Seeding ambulances...');
  await seedAmbulances();

  // Seed EMS data (drivers and other EMS-related data)
  console.log('🚨 Seeding EMS data...');
  await seedEMSData();

  // Seed patients
  console.log('👤 Seeding patients...');
  await seedPatients();

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
