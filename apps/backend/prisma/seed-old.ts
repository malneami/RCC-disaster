import { PrismaClient, HospitalStatus, TraumaLevel, CriticalCaseType, CriticalCaseSeverity, CriticalCaseStatus, HospitalTicketType, HospitalTicketStatus, TicketPriority, UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting comprehensive data seeding (preserving existing data)...');

  // Check existing data
  const existingHospitals = await prisma.hospital.count();
  const existingUsers = await prisma.user.count();
  const existingCriticalCases = await prisma.criticalCase.count();
  const existingHospitalTickets = await prisma.hospitalTicket.count();

  console.log(`📊 Existing data found:`);
  console.log(`   - Hospitals: ${existingHospitals}`);
  console.log(`   - Users: ${existingUsers}`);
  console.log(`   - Critical Cases: ${existingCriticalCases}`);
  console.log(`   - Hospital Tickets: ${existingHospitalTickets}`);

  // Only seed if no data exists or if explicitly requested
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
  
  if (existingHospitalTickets === 0) {
    console.log('🎫 No hospital tickets found, seeding hospital tickets...');
    await seedHospitalTickets();
  } else {
    console.log('🎫 Hospital tickets already exist, skipping hospital ticket seeding');
  }

  // Always run comprehensive case seeding for testing
  console.log('🚨 Running comprehensive case seeding...');
  await seedComprehensiveCases();

  // Always run stroke KPI test seed for comprehensive testing
  console.log('🧠 Running stroke KPI test seed...');
  await seedStrokeKpiTest();

  console.log('✅ Seeding completed successfully!');
}

async function seedHospitals() {
  console.log('🏥 Seeding hospitals...');
  
  const hospitals = [
    // Major Hospitals with full services
    {
      id: '1',
      name: 'Jazan General Hospital (JGH)',
      address: 'Jazan, Saudi Arabia',
      latitude: 16.8892,
      longitude: 42.5611,
      icuBeds: 20,
      icuBedsAvailable: 10,
      picuBeds: 5,
      picuBedsAvailable: 2,
      maleBeds: 40,
      maleBedsAvailable: 15,
      femaleBeds: 35,
      femaleBedsAvailable: 12,
      pediatricBeds: 15,
      pediatricBedsAvailable: 5,
      standardBeds: 90,
      standardBedsAvailable: 32,
      hasStemiService: false,
      hasStrokeService: false,
      hasTraumaService: true,
      cluster: 'Jazan',
      status: HospitalStatus.AVAILABLE,
      contactPhone: '+966 54 930 0261',
      contactEmail: 'jgh@moh.gov.sa',
      emergencyDeptStatus: 'available',
      nicuBeds: 0,
      nicuBedsAvailable: 0,
      hasStrokeUnit: false,
      traumaLevel: TraumaLevel.NONE,
      hasCardiologyCenter: false,
    },
    {
      id: '2',
      name: 'King Fahad Central Hospital (KFCH)',
      address: 'Jazan, Saudi Arabia',
      latitude: 16.9087,
      longitude: 42.5549,
      icuBeds: 30,
      icuBedsAvailable: 12,
      picuBeds: 8,
      picuBedsAvailable: 3,
      maleBeds: 60,
      maleBedsAvailable: 20,
      femaleBeds: 55,
      femaleBedsAvailable: 18,
      pediatricBeds: 25,
      pediatricBedsAvailable: 8,
      standardBeds: 140,
      standardBedsAvailable: 46,
      hasStemiService: true,
      hasStrokeService: true,
      hasTraumaService: true,
      cluster: 'Jazan',
      status: HospitalStatus.AVAILABLE,
      contactPhone: '+966 50 503 6789',
      contactEmail: 'kfch@moh.gov.sa',
      emergencyDeptStatus: 'available',
      nicuBeds: 0,
      nicuBedsAvailable: 0,
      hasStrokeUnit: false,
      traumaLevel: TraumaLevel.NONE,
      hasCardiologyCenter: false,
    },
    {
      id: '3',
      name: 'Prince Mohammed Bin Nasser Hospital (PMNH)',
      address: 'Jazan, Saudi Arabia',
      latitude: 16.8999,
      longitude: 42.5625,
      icuBeds: 15,
      icuBedsAvailable: 7,
      picuBeds: 5,
      picuBedsAvailable: 2,
      maleBeds: 35,
      maleBedsAvailable: 12,
      femaleBeds: 30,
      femaleBedsAvailable: 10,
      pediatricBeds: 15,
      pediatricBedsAvailable: 5,
      standardBeds: 80,
      standardBedsAvailable: 27,
      hasStemiService: true,
      hasStrokeService: true,
      hasTraumaService: false,
      cluster: 'Jazan',
      status: HospitalStatus.AVAILABLE,
      contactPhone: '+966 56 128 4567',
      contactEmail: 'pmnh@moh.gov.sa',
      emergencyDeptStatus: 'available',
      nicuBeds: 0,
      nicuBedsAvailable: 0,
      hasStrokeUnit: false,
      traumaLevel: TraumaLevel.NONE,
      hasCardiologyCenter: false,
    },
    // Regional Hospitals with varied services
    {
      id: '4',
      name: 'Samtah General Hospital',
      address: 'Samtah, Jazan, Saudi Arabia',
      latitude: 16.6050,
      longitude: 42.9419,
      icuBeds: 10,
      icuBedsAvailable: 4,
      picuBeds: 3,
      picuBedsAvailable: 1,
      maleBeds: 25,
      maleBedsAvailable: 10,
      femaleBeds: 25,
      femaleBedsAvailable: 10,
      pediatricBeds: 10,
      pediatricBedsAvailable: 4,
      standardBeds: 60,
      standardBedsAvailable: 24,
      hasStemiService: false,
      hasStrokeService: true,
      hasTraumaService: true,
      cluster: 'Jazan',
      status: HospitalStatus.AVAILABLE,
      contactPhone: '+966 58 211 9876',
      contactEmail: 'samtah@moh.gov.sa',
      emergencyDeptStatus: 'available',
      nicuBeds: 0,
      nicuBedsAvailable: 0,
      hasStrokeUnit: false,
      traumaLevel: TraumaLevel.NONE,
      hasCardiologyCenter: false,
    },
    {
      id: '5',
      name: 'Abu Arish General Hospital (AAGH)',
      address: 'Abu Arish, Jazan, Saudi Arabia',
      latitude: 16.9815,
      longitude: 42.8326,
      icuBeds: 12,
      icuBedsAvailable: 5,
      picuBeds: 4,
      picuBedsAvailable: 2,
      maleBeds: 30,
      maleBedsAvailable: 15,
      femaleBeds: 30,
      femaleBedsAvailable: 12,
      pediatricBeds: 12,
      pediatricBedsAvailable: 5,
      standardBeds: 72,
      standardBedsAvailable: 32,
      hasStemiService: false,
      hasStrokeService: false,
      hasTraumaService: true,
      cluster: 'Jazan',
      status: HospitalStatus.AVAILABLE,
      contactPhone: '+966 55 987 6321',
      contactEmail: 'aagh@moh.gov.sa',
      emergencyDeptStatus: 'available',
      nicuBeds: 0,
      nicuBedsAvailable: 0,
      hasStrokeUnit: false,
      traumaLevel: TraumaLevel.NONE,
      hasCardiologyCenter: false,
    },
    // Smaller hospitals with limited services
    {
      id: '6',
      name: 'Sabya General Hospital',
      icuBeds: 10,
      icuBedsAvailable: 5,
      picuBeds: 5,
      picuBedsAvailable: 2,
      maleBeds: 20,
      maleBedsAvailable: 10,
      femaleBeds: 20,
      femaleBedsAvailable: 10,
      pediatricBeds: 10,
      pediatricBedsAvailable: 5,
      standardBeds: 50,
      standardBedsAvailable: 25,
      hasStemiService: false,
      hasStrokeService: false,
      hasTraumaService: false,
      cluster: 'Jazan',
      status: HospitalStatus.ACTIVE,
      contactPhone: '+966 55 123 4567',
      contactEmail: 'sabya@moh.gov.sa',
      emergencyDeptStatus: 'available',
      nicuBeds: 5,
      nicuBedsAvailable: 2,
      hasStrokeUnit: false,
      traumaLevel: TraumaLevel.NONE,
      hasCardiologyCenter: false,
    },
    {
      id: '7',
      name: 'Baysh General Hospital',
      icuBeds: 8,
      icuBedsAvailable: 4,
      picuBeds: 4,
      picuBedsAvailable: 2,
      maleBeds: 15,
      maleBedsAvailable: 8,
      femaleBeds: 15,
      femaleBedsAvailable: 8,
      pediatricBeds: 8,
      pediatricBedsAvailable: 4,
      standardBeds: 40,
      standardBedsAvailable: 20,
      hasStemiService: false,
      hasStrokeService: false,
      hasTraumaService: false,
      cluster: 'Jazan',
      status: HospitalStatus.ACTIVE,
      contactPhone: '+966 55 234 5678',
      contactEmail: 'baysh@moh.gov.sa',
      emergencyDeptStatus: 'available',
      nicuBeds: 4,
      nicuBedsAvailable: 2,
      hasStrokeUnit: false,
      traumaLevel: TraumaLevel.NONE,
      hasCardiologyCenter: false,
    },
    {
      id: '8',
      name: 'Al-Hurrath General Hospital',
      icuBeds: 6,
      icuBedsAvailable: 3,
      picuBeds: 3,
      picuBedsAvailable: 1,
      maleBeds: 12,
      maleBedsAvailable: 6,
      femaleBeds: 12,
      femaleBedsAvailable: 6,
      pediatricBeds: 6,
      pediatricBedsAvailable: 3,
      standardBeds: 30,
      standardBedsAvailable: 15,
      hasStemiService: false,
      hasStrokeService: false,
      hasTraumaService: false,
      cluster: 'Jazan',
      status: HospitalStatus.ACTIVE,
      contactPhone: '+966 55 345 6789',
      contactEmail: 'alhurrath@moh.gov.sa',
      emergencyDeptStatus: 'available',
      nicuBeds: 3,
      nicuBedsAvailable: 1,
      hasStrokeUnit: false,
      traumaLevel: TraumaLevel.NONE,
      hasCardiologyCenter: false,
    },
    {
      id: '9',
      name: 'Al-Darb General Hospital',
      icuBeds: 6,
      icuBedsAvailable: 3,
      picuBeds: 3,
      picuBedsAvailable: 1,
      maleBeds: 12,
      maleBedsAvailable: 6,
      femaleBeds: 12,
      femaleBedsAvailable: 6,
      pediatricBeds: 6,
      pediatricBedsAvailable: 3,
      standardBeds: 30,
      standardBedsAvailable: 15,
      hasStemiService: false,
      hasStrokeService: false,
      hasTraumaService: false,
      cluster: 'Jazan',
      status: HospitalStatus.ACTIVE,
      contactPhone: '+966 55 456 7890',
      contactEmail: 'aldarb@moh.gov.sa',
      emergencyDeptStatus: 'available',
      nicuBeds: 3,
      nicuBedsAvailable: 1,
      hasStrokeUnit: false,
      traumaLevel: TraumaLevel.NONE,
      hasCardiologyCenter: false,
    },
    {
      id: '10',
      name: 'Al-Rayth General Hospital',
      icuBeds: 6,
      icuBedsAvailable: 3,
      picuBeds: 3,
      picuBedsAvailable: 1,
      maleBeds: 12,
      maleBedsAvailable: 6,
      femaleBeds: 12,
      femaleBedsAvailable: 6,
      pediatricBeds: 6,
      pediatricBedsAvailable: 3,
      standardBeds: 30,
      standardBedsAvailable: 15,
      hasStemiService: false,
      hasStrokeService: false,
      hasTraumaService: false,
      cluster: 'Jazan',
      status: HospitalStatus.ACTIVE,
      contactPhone: '+966 55 567 8901',
      contactEmail: 'alrayth@moh.gov.sa',
      emergencyDeptStatus: 'available',
      nicuBeds: 3,
      nicuBedsAvailable: 1,
      hasStrokeUnit: false,
      traumaLevel: TraumaLevel.NONE,
      hasCardiologyCenter: false,
    },
    {
      id: '11',
      name: 'Al-Tuwal General Hospital',
      icuBeds: 6,
      icuBedsAvailable: 3,
      picuBeds: 3,
      picuBedsAvailable: 1,
      maleBeds: 12,
      maleBedsAvailable: 6,
      femaleBeds: 12,
      femaleBedsAvailable: 6,
      pediatricBeds: 6,
      pediatricBedsAvailable: 3,
      standardBeds: 30,
      standardBedsAvailable: 15,
      hasStemiService: false,
      hasStrokeService: false,
      hasTraumaService: false,
      cluster: 'Jazan',
      status: HospitalStatus.ACTIVE,
      contactPhone: '+966 55 678 9012',
      contactEmail: 'altuwal@moh.gov.sa',
      emergencyDeptStatus: 'available',
      nicuBeds: 3,
      nicuBedsAvailable: 1,
      hasStrokeUnit: false,
      traumaLevel: TraumaLevel.NONE,
      hasCardiologyCenter: false,
    },
    {
      id: '12',
      name: 'Al-Aridha General Hospital',
      icuBeds: 6,
      icuBedsAvailable: 3,
      picuBeds: 3,
      picuBedsAvailable: 1,
      maleBeds: 12,
      maleBedsAvailable: 6,
      femaleBeds: 12,
      femaleBedsAvailable: 6,
      pediatricBeds: 6,
      pediatricBedsAvailable: 3,
      standardBeds: 30,
      standardBedsAvailable: 15,
      hasStemiService: false,
      hasStrokeService: false,
      hasTraumaService: false,
      cluster: 'Jazan',
      status: HospitalStatus.ACTIVE,
      contactPhone: '+966 55 789 0123',
      contactEmail: 'alaridha@moh.gov.sa',
      emergencyDeptStatus: 'available',
      nicuBeds: 3,
      nicuBedsAvailable: 1,
      hasStrokeUnit: false,
      traumaLevel: TraumaLevel.NONE,
      hasCardiologyCenter: false,
    },
    {
      id: '13',
      name: 'Al-Muwassam General Hospital',
      icuBeds: 6,
      icuBedsAvailable: 3,
      picuBeds: 3,
      picuBedsAvailable: 1,
      maleBeds: 12,
      maleBedsAvailable: 6,
      femaleBeds: 12,
      femaleBedsAvailable: 6,
      pediatricBeds: 6,
      pediatricBedsAvailable: 3,
      standardBeds: 30,
      standardBedsAvailable: 15,
      hasStemiService: false,
      hasStrokeService: false,
      hasTraumaService: false,
      cluster: 'Jazan',
      status: HospitalStatus.ACTIVE,
      contactPhone: '+966 55 890 1234',
      contactEmail: 'almuwassam@moh.gov.sa',
      emergencyDeptStatus: 'available',
      nicuBeds: 3,
      nicuBedsAvailable: 1,
      hasStrokeUnit: false,
      traumaLevel: TraumaLevel.NONE,
      hasCardiologyCenter: false,
    },
    {
      id: '14',
      name: 'Ahad Al-Masarhah General Hospital',
      icuBeds: 8,
      icuBedsAvailable: 4,
      picuBeds: 4,
      picuBedsAvailable: 2,
      maleBeds: 15,
      maleBedsAvailable: 8,
      femaleBeds: 15,
      femaleBedsAvailable: 8,
      pediatricBeds: 8,
      pediatricBedsAvailable: 4,
      standardBeds: 40,
      standardBedsAvailable: 20,
      hasStemiService: false,
      hasStrokeService: false,
      hasTraumaService: false,
      cluster: 'Jazan',
      status: HospitalStatus.ACTIVE,
      contactPhone: '+966 55 901 2345',
      contactEmail: 'ahad@moh.gov.sa',
      emergencyDeptStatus: 'available',
      nicuBeds: 4,
      nicuBedsAvailable: 2,
      hasStrokeUnit: false,
      traumaLevel: TraumaLevel.NONE,
      hasCardiologyCenter: false,
    },
    {
      id: '15',
      name: 'Bani Malik General Hospital',
      icuBeds: 6,
      icuBedsAvailable: 3,
      picuBeds: 3,
      picuBedsAvailable: 1,
      maleBeds: 12,
      maleBedsAvailable: 6,
      femaleBeds: 12,
      femaleBedsAvailable: 6,
      pediatricBeds: 6,
      pediatricBedsAvailable: 3,
      standardBeds: 30,
      standardBedsAvailable: 15,
      hasStemiService: false,
      hasStrokeService: false,
      hasTraumaService: false,
      cluster: 'Jazan',
      status: HospitalStatus.ACTIVE,
      contactPhone: '+966 55 012 3456',
      contactEmail: 'banimalik@moh.gov.sa',
      emergencyDeptStatus: 'available',
      nicuBeds: 3,
      nicuBedsAvailable: 1,
      hasStrokeUnit: false,
      traumaLevel: TraumaLevel.NONE,
      hasCardiologyCenter: false,
    },
    {
      id: '16',
      name: 'Eradah Mental Health Complex',
      icuBeds: 10,
      icuBedsAvailable: 5,
      picuBeds: 5,
      picuBedsAvailable: 2,
      maleBeds: 20,
      maleBedsAvailable: 10,
      femaleBeds: 20,
      femaleBedsAvailable: 10,
      pediatricBeds: 10,
      pediatricBedsAvailable: 5,
      standardBeds: 50,
      standardBedsAvailable: 25,
      hasStemiService: false,
      hasStrokeService: false,
      hasTraumaService: false,
      cluster: 'Jazan',
      status: HospitalStatus.ACTIVE,
      contactPhone: '+966 55 123 4567',
      contactEmail: 'eradah@moh.gov.sa',
      emergencyDeptStatus: 'available',
      nicuBeds: 5,
      nicuBedsAvailable: 2,
      hasStrokeUnit: false,
      traumaLevel: TraumaLevel.NONE,
      hasCardiologyCenter: false,
    },
    {
      id: '17',
      name: 'Chest Diseases Hospital',
      icuBeds: 8,
      icuBedsAvailable: 4,
      picuBeds: 4,
      picuBedsAvailable: 2,
      maleBeds: 15,
      maleBedsAvailable: 8,
      femaleBeds: 15,
      femaleBedsAvailable: 8,
      pediatricBeds: 8,
      pediatricBedsAvailable: 4,
      standardBeds: 40,
      standardBedsAvailable: 20,
      hasStemiService: false,
      hasStrokeService: false,
      hasTraumaService: false,
      cluster: 'Jazan',
      status: HospitalStatus.ACTIVE,
      contactPhone: '+966 55 234 5678',
      contactEmail: 'chest@moh.gov.sa',
      emergencyDeptStatus: 'available',
      nicuBeds: 4,
      nicuBedsAvailable: 2,
      hasStrokeUnit: false,
      traumaLevel: TraumaLevel.NONE,
      hasCardiologyCenter: false,
    },
    {
      id: '18',
      name: 'Al-Aidabi General Hospital',
      icuBeds: 6,
      icuBedsAvailable: 3,
      picuBeds: 3,
      picuBedsAvailable: 1,
      maleBeds: 12,
      maleBedsAvailable: 6,
      femaleBeds: 12,
      femaleBedsAvailable: 6,
      pediatricBeds: 6,
      pediatricBedsAvailable: 3,
      standardBeds: 30,
      standardBedsAvailable: 15,
      hasStemiService: false,
      hasStrokeService: false,
      hasTraumaService: false,
      cluster: 'Jazan',
      status: HospitalStatus.ACTIVE,
      contactPhone: '+966 55 345 6789',
      contactEmail: 'alaidabi@moh.gov.sa',
      emergencyDeptStatus: 'available',
      nicuBeds: 3,
      nicuBedsAvailable: 1,
      hasStrokeUnit: false,
      traumaLevel: TraumaLevel.NONE,
      hasCardiologyCenter: false,
    },
    {
      id: '19',
      name: 'Dhamad General Hospital',
      icuBeds: 6,
      icuBedsAvailable: 3,
      picuBeds: 3,
      picuBedsAvailable: 1,
      maleBeds: 12,
      maleBedsAvailable: 6,
      femaleBeds: 12,
      femaleBedsAvailable: 6,
      pediatricBeds: 6,
      pediatricBedsAvailable: 3,
      standardBeds: 30,
      standardBedsAvailable: 15,
      hasStemiService: false,
      hasStrokeService: false,
      hasTraumaService: false,
      cluster: 'Jazan',
      status: HospitalStatus.ACTIVE,
      contactPhone: '+966 55 456 7890',
      contactEmail: 'dhamad@moh.gov.sa',
      emergencyDeptStatus: 'available',
      nicuBeds: 3,
      nicuBedsAvailable: 1,
      hasStrokeUnit: false,
      traumaLevel: TraumaLevel.NONE,
      hasCardiologyCenter: false,
    },
    {
      id: '20',
      name: 'Farasan General Hospital',
      icuBeds: 6,
      icuBedsAvailable: 3,
      picuBeds: 3,
      picuBedsAvailable: 1,
      maleBeds: 12,
      maleBedsAvailable: 6,
      femaleBeds: 12,
      femaleBedsAvailable: 6,
      pediatricBeds: 6,
      pediatricBedsAvailable: 3,
      standardBeds: 30,
      standardBedsAvailable: 15,
      hasStemiService: false,
      hasStrokeService: false,
      hasTraumaService: false,
      cluster: 'Jazan',
      status: HospitalStatus.ACTIVE,
      contactPhone: '+966 55 567 8901',
      contactEmail: 'farasan@moh.gov.sa',
      emergencyDeptStatus: 'available',
      nicuBeds: 3,
      nicuBedsAvailable: 1,
      hasStrokeUnit: false,
      traumaLevel: TraumaLevel.NONE,
      hasCardiologyCenter: false,
    },
    {
      id: '21',
      name: 'Fayfa General Hospital',
      icuBeds: 6,
      icuBedsAvailable: 3,
      picuBeds: 3,
      picuBedsAvailable: 1,
      maleBeds: 12,
      maleBedsAvailable: 6,
      femaleBeds: 12,
      femaleBedsAvailable: 6,
      pediatricBeds: 6,
      pediatricBedsAvailable: 3,
      standardBeds: 30,
      standardBedsAvailable: 15,
      hasStemiService: false,
      hasStrokeService: false,
      hasTraumaService: false,
      cluster: 'Jazan',
      status: HospitalStatus.ACTIVE,
      contactPhone: '+966 55 678 9012',
      contactEmail: 'fayfa@moh.gov.sa',
      emergencyDeptStatus: 'available',
      nicuBeds: 3,
      nicuBedsAvailable: 1,
      hasStrokeUnit: false,
      traumaLevel: TraumaLevel.NONE,
      hasCardiologyCenter: false,
    },
    {
      id: '22',
      name: 'Jazan Specialized Hospital',
      icuBeds: 15,
      icuBedsAvailable: 8,
      picuBeds: 8,
      picuBedsAvailable: 4,
      maleBeds: 30,
      maleBedsAvailable: 15,
      femaleBeds: 30,
      femaleBedsAvailable: 15,
      pediatricBeds: 15,
      pediatricBedsAvailable: 8,
      standardBeds: 60,
      standardBedsAvailable: 30,
      hasStemiService: true,
      hasStrokeService: true,
      hasTraumaService: true,
      cluster: 'Jazan',
      status: HospitalStatus.ACTIVE,
      contactPhone: '+966 55 789 0123',
      contactEmail: 'jazan.specialized@moh.gov.sa',
      emergencyDeptStatus: 'available',
      nicuBeds: 8,
      nicuBedsAvailable: 4,
      hasStrokeUnit: false,
      traumaLevel: TraumaLevel.NONE,
      hasCardiologyCenter: false,
    },
    {
      id: '23',
      name: 'PHC Centers',
      icuBeds: 0,
      icuBedsAvailable: 0,
      picuBeds: 0,
      picuBedsAvailable: 0,
      maleBeds: 0,
      maleBedsAvailable: 0,
      femaleBeds: 0,
      femaleBedsAvailable: 0,
      pediatricBeds: 0,
      pediatricBedsAvailable: 0,
      standardBeds: 0,
      standardBedsAvailable: 0,
      hasStemiService: false,
      hasStrokeService: false,
      hasTraumaService: false,
      cluster: 'Jazan',
      status: HospitalStatus.AVAILABLE,
      contactPhone: '+966 55 890 1234',
      contactEmail: 'phc@moh.gov.sa',
      emergencyDeptStatus: 'available',
      nicuBeds: 0,
      nicuBedsAvailable: 0,
      hasStrokeUnit: false,
      traumaLevel: TraumaLevel.NONE,
      hasCardiologyCenter: false,
    },
    {
      id: '24',
      name: 'Private Hospital',
      address: 'Various Private Locations',
      icuBeds: 0,
      icuBedsAvailable: 0,
      picuBeds: 0,
      picuBedsAvailable: 0,
      maleBeds: 0,
      maleBedsAvailable: 0,
      femaleBeds: 0,
      femaleBedsAvailable: 0,
      pediatricBeds: 0,
      pediatricBedsAvailable: 0,
      standardBeds: 0,
      standardBedsAvailable: 0,
      hasStemiService: false,
      hasStrokeService: false,
      hasTraumaService: false,
      cluster: 'Jazan',
      status: HospitalStatus.ACTIVE,
      contactPhone: '+966 55 901 2345',
      contactEmail: 'private@moh.gov.sa',
      emergencyDeptStatus: 'available',
      nicuBeds: 0,
      nicuBedsAvailable: 0,
      hasStrokeUnit: false,
      traumaLevel: TraumaLevel.NONE,
      hasCardiologyCenter: false,
    },
    {
      id: '25',
      name: 'Other Hospital',
      address: 'External Healthcare Facility',
      icuBeds: 0,
      icuBedsAvailable: 0,
      picuBeds: 0,
      picuBedsAvailable: 0,
      maleBeds: 0,
      maleBedsAvailable: 0,
      femaleBeds: 0,
      femaleBedsAvailable: 0,
      pediatricBeds: 0,
      pediatricBedsAvailable: 0,
      standardBeds: 0,
      standardBedsAvailable: 0,
      hasStemiService: false,
      hasStrokeService: false,
      hasTraumaService: false,
      cluster: 'Jazan',
      status: HospitalStatus.ACTIVE,
      contactPhone: '+966 55 012 3456',
      contactEmail: 'other@moh.gov.sa',
      emergencyDeptStatus: 'available',
      nicuBeds: 0,
      nicuBedsAvailable: 0,
      hasStrokeUnit: false,
      traumaLevel: TraumaLevel.NONE,
      hasCardiologyCenter: false,
    },
  ];

  for (const hospital of hospitals) {
    try {
      await prisma.hospital.upsert({
        where: { id: hospital.id },
        update: hospital,
        create: hospital,
      });
    } catch (error) {
      console.log(`⚠️  Hospital ${hospital.name} already exists, skipping...`);
    }
  }

  console.log(`✅ Hospitals seeded successfully`);
}

async function seedUsers() {
  console.log('👥 Seeding users...');
  
  // Hash the password
  const passwordHash = await bcrypt.hash('Healthcare@2024', 10);
  
  const users = [
    {
      email: 'admin@rcc.com',
      firstName: 'System',
      lastName: 'Administrator',
      phoneNumber: '+966 50 000 0001',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
      passwordHash: passwordHash,
      hospitalId: '2', // KFCH
    },
    {
      email: 'coordinator@rcc.com',
      firstName: 'RCC',
      lastName: 'Coordinator',
      phoneNumber: '+966 50 000 0002',
      role: UserRole.RCC,
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
      passwordHash: passwordHash,
      hospitalId: '2', // KFCH
    },
    {
      email: 'ems@rcc.com',
      firstName: 'EMS',
      lastName: 'Operator',
      phoneNumber: '+966 50 000 0003',
      role: UserRole.EMS,
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
      passwordHash: passwordHash,
      hospitalId: '1', // JGH
    },
    {
      email: 'datacollector@rcc.com',
      firstName: 'Data',
      lastName: 'Collector',
      phoneNumber: '+966 50 000 0004',
      role: UserRole.DATA_COLLECTOR,
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
      passwordHash: passwordHash,
      hospitalId: '3', // PMNH
    },
    {
      email: 'cathlab@rcc.com',
      firstName: 'Cath Lab',
      lastName: 'Technician',
      phoneNumber: '+966 50 000 0005',
      role: UserRole.CATH_LAB_USER,
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
      passwordHash: passwordHash,
      hospitalId: '2', // KFCH
    },
  ];

  for (const user of users) {
    try {
      await prisma.user.upsert({
        where: { email: user.email },
        update: user,
        create: user,
      });
    } catch (error) {
      console.log(`⚠️  User ${user.email} already exists, skipping...`);
    }
  }

  console.log(`✅ Users seeded successfully`);
}

async function seedCriticalCases() {
  console.log('🚨 Seeding critical cases...');
  
  const users = await prisma.user.findMany();
  const hospitals = await prisma.hospital.findMany();
  
  if (users.length === 0 || hospitals.length === 0) {
    console.log('⚠️  No users or hospitals found for critical cases');
    return;
  }

  const criticalCases = [
    // STEMI Cases
    {
      patientName: 'Ahmed Al-Rashid',
      caseType: CriticalCaseType.STEMI,
      severity: CriticalCaseSeverity.CRITICAL,
      status: CriticalCaseStatus.ACTIVE,
      startTime: new Date('2024-01-15T10:30:00Z'),
      description: 'Acute STEMI requiring immediate intervention - Patient presenting with chest pain and ST elevation',
      hospitalId: '2', // KFCH
      createdById: users[1].id, // RCC Coordinator
    },
    {
      patientName: 'Fatima Al-Zahra',
      caseType: CriticalCaseType.STEMI,
      severity: CriticalCaseSeverity.URGENT,
      status: CriticalCaseStatus.ACTIVE,
      startTime: new Date('2024-01-15T09:15:00Z'),
      description: 'STEMI case transferred from regional hospital - Requires cath lab intervention',
      hospitalId: '3', // PMNH
      createdById: users[2].id, // EMS Operator
    },
    // Stroke Cases
    {
      patientName: 'Mohammed Al-Sayed',
      caseType: CriticalCaseType.STROKE,
      severity: CriticalCaseSeverity.CRITICAL,
      status: CriticalCaseStatus.ACTIVE,
      startTime: new Date('2024-01-15T08:45:00Z'),
      description: 'Ischemic stroke with time-sensitive treatment window - Patient showing signs of aphasia',
      hospitalId: '2', // KFCH
      createdById: users[1].id, // RCC Coordinator
    },
    {
      patientName: 'Aisha Al-Mansouri',
      caseType: CriticalCaseType.STROKE,
      severity: CriticalCaseSeverity.URGENT,
      status: CriticalCaseStatus.ACTIVE,
      startTime: new Date('2024-01-15T11:20:00Z'),
      description: 'Hemorrhagic stroke requiring immediate neurosurgical intervention',
      hospitalId: '10', // Jazan Specialized
      createdById: users[3].id, // Data Collector
    },
    // Trauma Cases
    {
      patientName: 'Omar Al-Hamdan',
      caseType: CriticalCaseType.TRAUMA,
      severity: CriticalCaseSeverity.CRITICAL,
      status: CriticalCaseStatus.ACTIVE,
      startTime: new Date('2024-01-15T07:30:00Z'),
      description: 'Multiple trauma with severe bleeding - MVA victim with multiple fractures',
      hospitalId: '1', // JGH
      createdById: users[2].id, // EMS Operator
    },
    {
      patientName: 'Layla Al-Qahtani',
      caseType: CriticalCaseType.TRAUMA,
      severity: CriticalCaseSeverity.URGENT,
      status: CriticalCaseStatus.ACTIVE,
      startTime: new Date('2024-01-15T12:45:00Z'),
      description: 'Trauma case requiring immediate surgery - Fall victim with head injury',
      hospitalId: '4', // Samtah
      createdById: users[0].id, // Admin
    },
    // Resolved Cases
    {
      patientName: 'Khalid Al-Otaibi',
      caseType: CriticalCaseType.STEMI,
      severity: CriticalCaseSeverity.CRITICAL,
      status: CriticalCaseStatus.RESOLVED,
      startTime: new Date('2024-01-14T15:20:00Z'),
      description: 'STEMI case successfully treated with PCI - Patient stable and discharged',
      hospitalId: '2', // KFCH
      createdById: users[4].id, // Cath Lab Technician
    },
    {
      patientName: 'Noura Al-Dossary',
      caseType: CriticalCaseType.STROKE,
      severity: CriticalCaseSeverity.URGENT,
      status: CriticalCaseStatus.TRANSFERRED,
      startTime: new Date('2024-01-14T18:10:00Z'),
      description: 'Stroke case transferred to specialized center for advanced treatment',
      hospitalId: '3', // PMNH
      createdById: users[3].id, // Data Collector
    },
  ];

  for (const criticalCase of criticalCases) {
    try {
      await prisma.criticalCase.create({
        data: criticalCase,
      });
    } catch (error) {
      console.log(`⚠️  Critical case for ${criticalCase.patientName} already exists, skipping...`);
    }
  }

  console.log(`✅ Critical cases seeded successfully`);
}

async function seedHospitalTickets() {
  console.log('🎫 Seeding hospital tickets...');
  
  const users = await prisma.user.findMany();
  const hospitals = await prisma.hospital.findMany();
  
  if (users.length === 0 || hospitals.length === 0) {
    console.log('⚠️  No users or hospitals found for hospital tickets');
    return;
  }

  const hospitalTickets = [
    // Resource Tickets
    {
      title: 'ICU Bed Request - STEMI Patient',
      description: 'Urgent request for ICU bed for STEMI patient requiring immediate care and monitoring',
              type: HospitalTicketType.EMERGENCY,
      priority: TicketPriority.CRITICAL,
      status: HospitalTicketStatus.IN_PROGRESS,
      hospitalId: '2', // KFCH
      createdById: users[1].id, // RCC Coordinator
      assignedToId: users[4].id, // Cath Lab Technician
    },
    {
      title: 'Equipment Maintenance Request',
      description: 'Scheduled maintenance for medical equipment unit #3 - Requires immediate attention',
      type: HospitalTicketType.MAINTENANCE,
      priority: TicketPriority.CRITICAL,
      status: HospitalTicketStatus.OPEN,
      hospitalId: '1', // JGH
      createdById: users[2].id, // EMS Operator
    },
    // Consultation Tickets
    {
      title: 'Cardiologist Consultation',
      description: 'Request for cardiologist consultation for complex case requiring expert opinion',
      type: HospitalTicketType.CONSULTATION,
      priority: TicketPriority.CRITICAL,
      status: HospitalTicketStatus.OPEN,
      hospitalId: '3', // PMNH
      createdById: users[3].id, // Data Collector
    },
    {
      title: 'Neurologist Consultation - Stroke Case',
      description: 'Urgent consultation needed for stroke patient showing unusual symptoms',
      type: HospitalTicketType.CONSULTATION,
      priority: TicketPriority.CRITICAL,
      status: HospitalTicketStatus.IN_PROGRESS,
      hospitalId: '10', // Jazan Specialized
      createdById: users[1].id, // RCC Coordinator
    },
    // Transfer Tickets
    {
      title: 'Patient Transfer Request - Trauma',
      description: 'Request to transfer trauma patient to specialized trauma center for advanced care',
      type: HospitalTicketType.TRANSFER,
      priority: TicketPriority.CRITICAL,
      status: HospitalTicketStatus.OPEN,
      hospitalId: '4', // Samtah
      createdById: users[0].id, // Admin
    },
    {
      title: 'Emergency Transfer - Critical Patient',
      description: 'Emergency transfer request for critical patient requiring immediate specialized care',
      type: HospitalTicketType.TRANSFER,
      priority: TicketPriority.CRITICAL,
      status: HospitalTicketStatus.IN_PROGRESS,
      hospitalId: '8', // Al-Hurrath (Critical capacity)
      createdById: users[2].id, // EMS Operator
    },
    // System Tickets
    {
      title: 'Hospital Information System Update',
      description: 'Scheduled update for hospital information system - Requires downtime planning',
      type: HospitalTicketType.MAINTENANCE,
      priority: TicketPriority.MEDIUM,
      status: HospitalTicketStatus.RESOLVED,
      hospitalId: '2', // KFCH
      createdById: users[0].id, // Admin
      assignedToId: users[3].id, // Data Collector
    },
    {
      title: 'Network Connectivity Issue',
      description: 'Intermittent network connectivity issues affecting patient monitoring systems',
      type: HospitalTicketType.MAINTENANCE,
      priority: TicketPriority.CRITICAL,
      status: HospitalTicketStatus.OPEN,
      hospitalId: '5', // Abu Arish
      createdById: users[1].id, // RCC Coordinator
    },
    // Resolved Tickets
    {
      title: 'Equipment Calibration Complete',
      description: 'Annual calibration of medical equipment completed successfully',
      type: HospitalTicketType.MAINTENANCE,
      priority: TicketPriority.MEDIUM,
      status: HospitalTicketStatus.RESOLVED,
      hospitalId: '6', // Sabya
      createdById: users[3].id, // Data Collector
    },
    {
      title: 'Staff Training Session',
      description: 'Emergency response training session completed for nursing staff',
      type: HospitalTicketType.CONSULTATION,
      priority: TicketPriority.MEDIUM,
      status: HospitalTicketStatus.CLOSED,
      hospitalId: '7', // Baysh
      createdById: users[0].id, // Admin
    },
  ];

  for (const hospitalTicket of hospitalTickets) {
    try {
      await prisma.hospitalTicket.create({
        data: hospitalTicket,
      });
    } catch (error) {
      console.log(`⚠️  Hospital ticket "${hospitalTicket.title}" already exists, skipping...`);
    }
  }

  console.log(`✅ Hospital tickets seeded successfully`);
}

// Helper function to add minutes to a date
function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60000);
}

// Helper function to get random item from array
function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

// Helper function to generate random boolean with probability
function randomBoolean(probability: number = 0.5): boolean {
  return Math.random() < probability;
}

async function seedComprehensiveCases() {
  console.log('🚨 Starting comprehensive case seeding...');

  // Get hospitals and users
  const hospitals = await prisma.hospital.findMany();
  const users = await prisma.user.findMany();

  if (hospitals.length === 0 || users.length === 0) {
    console.log('❌ No hospitals or users found. Please run the main seed first.');
    return;
  }

  // Create patients if needed (using different naming to avoid conflicts)
  let patients = await prisma.patient.findMany({ take: 10 });
  
  if (patients.length < 10) {
    for (let i = patients.length; i < 10; i++) {
      const patient = await prisma.patient.create({
        data: {
          firstName: `CasePatient${i + 1}`,
          lastName: `Comprehensive${i + 1}`,
          nationalId: `987654321${i.toString().padStart(2, '0')}`,
          mrn: `CASE-MRN${i + 1}`,
          age: 45 + Math.floor(Math.random() * 40),
          gender: getRandomItem(['MALE', 'FEMALE']),
          phoneNumber: `+966509876${i.toString().padStart(3, '0')}`,
          email: `casepatient${i + 1}@test.com`,
          address: `Case Address ${i + 1}`,
          emergencyContact: `Case Emergency Contact ${i + 1}`,
          emergencyPhone: `+966509876${i.toString().padStart(3, '0')}`,
          medicalHistory: 'Hypertension, Diabetes',
          allergies: 'None',
          medications: 'Aspirin, Metformin',
          bloodType: getRandomItem(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
          createdBy: {
            connect: { id: users[0].id }
          }
        },
      });
      patients.push(patient);
    }
  }

  console.log(`👥 Created ${patients.length} patients`);

  // Create STEMI cases
  console.log('❤️ Creating STEMI cases...');
  for (let i = 0; i < 12; i++) {
    const patient = patients[i % patients.length];
    const hospital = hospitals[i % hospitals.length];
    const user = users[i % users.length];

    // Create transfer ticket for some cases
    let ticket = null;
    if (Math.random() > 0.4) {
      ticket = await prisma.ticket.create({
        data: {
          ticketNumber: `STEMI-${Date.now()}-${i}`,
          patientId: patient.id,
          originHospitalId: hospital.id,
          destinationHospitalId: hospitals[(i + 1) % hospitals.length].id,
          pathway: 'STEMI',
          
          priority: getRandomItem(['CRITICAL', 'EMERGENCY']),
          emergencyType: 'STEMI',
          status: getRandomItem(['PENDING', 'ASSIGNED', 'COMPLETED']),
          notes: `STEMI case: Chest pain with ST elevation`,
          createdById: user.id,
        },
      });
    }

    // Create STEMI case
    await prisma.stemiCase.create({
      data: {
        ticketId: ticket?.id || null,
        patientId: patient.id,
        originHospitalId: hospital.id,
        destinationHospitalId: ticket ? hospitals[(i + 1) % hospitals.length].id : null,
        
        // Basic Information
        currentStatus: getRandomItem(['SUSPECTED', 'STEMI_CONFIRMED', 'PCI_READY', 'BALLOON_INFLATED', 'CCU_ADMITTED']),
        selectedTreatment: getRandomItem(['PCI', 'THROMBOLYSIS', 'CONSERVATIVE_MANAGEMENT']),
        
        // Timing
        symptomOnset: new Date(Date.now() - Math.random() * 3600000), // Within last hour
        triageTime: new Date(Date.now() - Math.random() * 1800000), // Within last 30 min
        firstEcgTime: new Date(Date.now() - Math.random() * 900000), // Within last 15 min
        
        // Clinical Data
        ecgResult: getRandomItem(['STEMI_ANTERIOR', 'STEMI_INFERIOR', 'STEMI_LATERAL', 'NSTEMI_CHANGES']),
        ecgFindings: `ECG findings for case ${i + 1}`,
        
        // Treatment
        eligibleForPrimaryPci: Math.random() > 0.3,
        thrombolyticGiven: Math.random() > 0.7,
        doorToBalloonMinutes: Math.random() > 0.3 ? Math.floor(Math.random() * 120) : null,
        
        createdById: user.id,
      },
    });
  }

  // Create Stroke cases
  console.log('🧠 Creating Stroke cases...');
  for (let i = 0; i < 12; i++) {
    const patient = patients[i % patients.length];
    const hospital = hospitals[i % hospitals.length];
    const user = users[i % users.length];

    // Create transfer ticket for some cases
    let ticket = null;
    if (Math.random() > 0.4) {
      ticket = await prisma.ticket.create({
        data: {
          ticketNumber: `STROKE-${Date.now()}-${i}`,
          patientId: patient.id,
          originHospitalId: hospital.id,
          destinationHospitalId: hospitals[(i + 1) % hospitals.length].id,
          pathway: 'STROKE',
          
          priority: getRandomItem(['CRITICAL', 'EMERGENCY']),
          emergencyType: 'STROKE',
          status: getRandomItem(['PENDING', 'ASSIGNED', 'COMPLETED']),
          notes: `Stroke case: Acute neurological deficit`,
          createdById: user.id,
        },
      });
    }

    // Create Stroke case
    await prisma.strokeCase.create({
      data: {
        ticketId: ticket?.id || null,
        patientId: patient.id,
        originHospitalId: hospital.id,
        destinationHospitalId: ticket ? hospitals[(i + 1) % hospitals.length].id : null,
        
        // Basic Information
        strokeType: getRandomItem(['ISCHEMIC', 'HEMORRHAGIC', 'TIA']),
        currentStatus: getRandomItem(['SUSPECTED', 'CONFIRMED', 'TREATMENT_EVALUATION', 'TREATMENT_COMPLETE']),
        selectedTreatment: getRandomItem(['IV_THROMBOLYSIS', 'MECHANICAL_THROMBECTOMY', 'CONSERVATIVE_MANAGEMENT']),
        
        // Timing
        timeOfSymptomOnset: new Date(Date.now() - Math.random() * 7200000), // Within last 2 hours
        dateOfAdmission: new Date(Date.now() - Math.random() * 1800000), // Within last 30 min
        timeOfPhysicianAssessment: new Date(Date.now() - Math.random() * 900000), // Within last 15 min
        
        // Clinical Assessment
        strokeTypeDetailed: getRandomItem(['ISCHEMIC_STROKE', 'HEMORRHAGIC_STROKE', 'TRANSIENT_ISCHEMIC_ATTACK_TIA']),
        ctScanPerformed: true,
        timeOfCtScanStart: new Date(Date.now() - Math.random() * 600000), // Within last 10 min
        ctFindings: getRandomItem(['NORMAL', 'HEMORRHAGE', 'ISCHEMIC_CHANGES']),
        
        // Treatment
        candidateForIVThrombolysis: getRandomItem(['YES', 'NO']),
        ivThrombolysisGiven: Math.random() > 0.6 ? 'YES' : 'NO',
        candidateForMechanicalThrombectomy: getRandomItem(['YES', 'NO']),
        mechanicalThrombectomyPerformed: Math.random() > 0.8,
        
        // Disposition
        admittedToStrokeUnit: Math.random() > 0.3,
        disposition: getRandomItem(['STROKE_UNIT', 'INPATIENT_WARD', 'DISCHARGED_HOME']),
        
        createdById: user.id,
      },
    });
  }

  // Create Trauma cases
  console.log('🚑 Creating Trauma cases...');
  for (let i = 0; i < 12; i++) {
    const patient = patients[i % patients.length];
    const hospital = hospitals[i % hospitals.length];
    const user = users[i % users.length];

    // Create transfer ticket for some cases
    let ticket = null;
    if (Math.random() > 0.4) {
      ticket = await prisma.ticket.create({
        data: {
          ticketNumber: `TRAUMA-${Date.now()}-${i}`,
          patientId: patient.id,
          originHospitalId: hospital.id,
          destinationHospitalId: hospitals[(i + 1) % hospitals.length].id,
          pathway: 'TRAUMA',
          
          priority: getRandomItem(['CRITICAL', 'EMERGENCY']),
          emergencyType: 'TRAUMA',
          status: getRandomItem(['PENDING', 'ASSIGNED', 'COMPLETED']),
          notes: `Trauma case: MVA with head and chest injuries`,
          createdById: user.id,
        },
      });
    }

    // Create Trauma case
    await prisma.traumaCase.create({
      data: {
        ticketId: ticket?.id || null,
        patientId: patient.id,
        originHospitalId: hospital.id,
        destinationHospitalId: ticket ? hospitals[(i + 1) % hospitals.length].id : null,
        
        // Basic Information
        arrivalDateTime: new Date(Date.now() - Math.random() * 3600000), // Within last hour
        incidentDateTime: new Date(Date.now() - Math.random() * 7200000), // Within last 2 hours
        modeOfArrival: getRandomItem(['AMBULANCE_RED_CRESCENT', 'PRIVATE_CAR', 'TRANSFERRED_FROM_ANOTHER_HOSPITAL']),
        mechanismOfInjury: getRandomItem(['MOTOR_VEHICLE_ACCIDENT', 'FALL', 'PENETRATING', 'BURN', 'OTHER']),
        
        // Clinical Assessment
        glasgowComaScale: Math.floor(Math.random() * 8) + 3, // 3-15
        systolicBloodPressure: Math.floor(Math.random() * 60) + 80, // 80-140
        respiratoryRate: Math.floor(Math.random() * 20) + 12, // 12-32
        
        // Injuries
        headAndNeckInjury: Math.random() > 0.5 ? 'Head trauma present' : null,
        chestInjury: Math.random() > 0.5 ? 'Chest trauma present' : null,
        abdomenInjury: Math.random() > 0.5 ? 'Abdominal trauma present' : null,
        extremitiesInjury: Math.random() > 0.5 ? 'Extremity trauma present' : null,
        
        // Additional Notes
        additionalNotes: `Trauma case with ${Math.random() > 0.5 ? 'surgery required' : 'conservative management'}. ${Math.random() > 0.6 ? 'Blood transfusion administered.' : ''} ${Math.random() > 0.8 ? 'Complications: ' + getRandomItem(['Infection', 'Bleeding', 'Organ failure', 'Sepsis']) : ''}`,
        
        createdById: user.id,
      },
    });
  }

  console.log('✅ Comprehensive case seeding completed successfully!');
  console.log('📊 Created:');
  console.log(`   - 12 STEMI cases (${Math.floor(12 * 0.6)} with transfer tickets)`);
  console.log(`   - 12 Stroke cases (${Math.floor(12 * 0.6)} with transfer tickets)`);
  console.log(`   - 12 Trauma cases (${Math.floor(12 * 0.6)} with transfer tickets)`);
}

async function seedStrokeKpiTest() {
  console.log('🧠 Starting Stroke KPI Test Seed...');

  // Check if stroke cases already exist from comprehensive seeding
  const existingStrokeCases = await prisma.strokeCase.count();
  if (existingStrokeCases > 0) {
    console.log(`🧠 Found ${existingStrokeCases} existing stroke cases, skipping KPI test seed to avoid conflicts`);
    return;
  }

  // Get hospitals
  const hospitals = await prisma.hospital.findMany();
  if (hospitals.length === 0) {
    console.log('❌ No hospitals found. Please run the main seed first.');
    return;
  }

  // Get users
  const users = await prisma.user.findMany();
  if (users.length === 0) {
    console.log('❌ No users found. Please run the main seed first.');
    return;
  }

  // Get existing patients or create new ones (using KPI-specific naming)
  let patients = await prisma.patient.findMany({ take: 20 });
  
  if (patients.length < 20) {
    // Create additional patients if needed (using KPI-specific naming)
    for (let i = patients.length; i < 20; i++) {
      const patient = await prisma.patient.create({
        data: {
          firstName: `KpiPatient${i + 1}`,
          lastName: `StrokeTest${i + 1}`,
          nationalId: `111111111${i.toString().padStart(2, '0')}`,
          mrn: `KPI-MRN${i + 1}`,
          age: 45 + Math.floor(Math.random() * 40), // 45-85 years
          gender: getRandomItem(['MALE', 'FEMALE']),
          phoneNumber: `+966501111${i.toString().padStart(3, '0')}`,
          email: `kpipatient${i + 1}@test.com`,
          address: `KPI Test Address ${i + 1}`,
          emergencyContact: `KPI Emergency Contact ${i + 1}`,
          emergencyPhone: `+966501111${i.toString().padStart(3, '0')}`,
          medicalHistory: 'Hypertension, Diabetes',
          allergies: 'None',
          medications: 'Aspirin, Metformin',
          bloodType: getRandomItem(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
          createdBy: {
            connect: { id: users[0].id }
          }
        },
      });
      patients.push(patient);
    }
  }

  console.log(`👥 Created ${patients.length} patients`);

  // Create stroke cases with varied KPI results
  const strokeCases = [];
  
  // Scenario 1: Excellent KPI performance (5 cases)
  for (let i = 0; i < 5; i++) {
    // Use a consistent base time (2 hours ago) to ensure realistic timing
    const baseTime = new Date();
    baseTime.setHours(baseTime.getHours() - 2);
    const admissionTime = new Date(baseTime);
    
    const strokeCase = await prisma.strokeCase.create({
      data: {
        ticketId: null,
        patientId: patients[i].id,
        originHospitalId: hospitals[0].id,
        destinationHospitalId: null,
        
        // Basic Information
        strokeType: 'ISCHEMIC',
        currentStatus: 'TREATMENT_COMPLETE',
        selectedTreatment: 'IV_THROMBOLYSIS',
        
        // Patient Arrival & Timing - EXCELLENT PERFORMANCE
        modeOfArrival: 'AMBULANCE_RED_CRESCENT',
        srcaCallTime: addMinutes(admissionTime, -45), // 45 min before arrival
        timeOfSymptomOnset: addMinutes(admissionTime, -120), // 2 hours before arrival
        lastKnownNormal: addMinutes(admissionTime, -120),
        dateOfAdmission: admissionTime,
        timeOfTriage: addMinutes(admissionTime, 2), // 2 min after registration
        timeOfPhysicianAssessment: addMinutes(admissionTime, 10), // 10 min after registration
        
        // Clinical Assessment & Diagnosis
        strokeTypeDetailed: 'ISCHEMIC_STROKE',
        swallowingScreeningPerformed: true,
        timeOfSwallowingScreening: addMinutes(admissionTime, 15), // 15 min after registration
        swallowingScreeningResult: 'PASS',
        ctScanPerformed: true,
        timeOfCtScanStart: addMinutes(admissionTime, 15), // 15 min after registration
        timeOfCtReportFinal: addMinutes(admissionTime, 25), // 25 min after registration
        ctFindings: 'NORMAL',
        lvoDetected: false,
        
        // Treatment Details
        candidateForIVThrombolysis: 'YES',
        thrombolysisOrderTime: addMinutes(admissionTime, 30), // 30 min after registration
        ivThrombolysisAdministrationTime: addMinutes(admissionTime, 45), // 45 min after registration
        ivThrombolysisGiven: 'YES',
        reasonForNotAdministeringIV: null,
        candidateForMechanicalThrombectomy: 'NO',
        timeOfMechanicalThrombectomyPuncture: null,
        mechanicalThrombectomyPerformed: false,
        timeOfThrombectomyComplete: null,
        
        // Disposition & Transfer Decisions
        facilityHasCt: true,
        transferToAnotherHospital: false,
        timeOfTransferActivation: null,
        timeOfTransferDeparture: null,
        prehospitalNotificationBySrca: true,
        prehospitalNotificationByUccPhc: false,
        disposition: 'STROKE_UNIT',
        referralTo: ['STROKE_UNIT'],
        admittedToStrokeUnit: true,
        
        // Follow-up & Outcome Tracking
        followUpContactAttempted: true,
        modifiedRankinScaleAt90Days: 'SCORE_0',
        
        // Legacy fields
        strokeSubtype: 'LARGE_VESSEL_OCCLUSION',
        eligibleForThrombolysis: true,
        thrombolysisContraindications: null,
        eligibleForThrombectomy: false,
        thrombectomyContraindications: 'No LVO detected',
        pathwayStarted: addMinutes(admissionTime, 5),
        pathwayCompleted: addMinutes(admissionTime, 60),
        strokeUnitAdmissionTime: addMinutes(admissionTime, 90),
        symptomNeedleMinutes: 165, // 2h45min from symptom onset
        symptomToMechanicalThrombectomyMinutes: null,
        imagingToNeedleMinutes: 30,
        imagingToMechanicalThrombectomyMinutes: null,
        
        // KPI calculations will be done by the service
        createdById: users[0].id,
      },
    });
    strokeCases.push(strokeCase);
  }

  // Scenario 2: Good KPI performance (5 cases)
  for (let i = 5; i < 10; i++) {
    // Use a consistent base time (4 hours ago) to ensure realistic timing
    const baseTime = new Date();
    baseTime.setHours(baseTime.getHours() - 4);
    const admissionTime = new Date(baseTime);
    
    const strokeCase = await prisma.strokeCase.create({
      data: {
        ticketId: null,
        patientId: patients[i].id,
        originHospitalId: hospitals[1].id,
        destinationHospitalId: null,
        
        // Basic Information
        strokeType: 'ISCHEMIC',
        currentStatus: 'TREATMENT_COMPLETE',
        selectedTreatment: 'IV_THROMBOLYSIS',
        
        // Patient Arrival & Timing - GOOD PERFORMANCE
        modeOfArrival: 'AMBULANCE_RED_CRESCENT',
        srcaCallTime: addMinutes(admissionTime, -50), // 50 min before arrival
        timeOfSymptomOnset: addMinutes(admissionTime, -180), // 3 hours before arrival
        lastKnownNormal: addMinutes(admissionTime, -180),
        dateOfAdmission: admissionTime,
        timeOfTriage: addMinutes(admissionTime, 5), // 5 min after registration
        timeOfPhysicianAssessment: addMinutes(admissionTime, 18), // 18 min after registration
        
        // Clinical Assessment & Diagnosis
        strokeTypeDetailed: 'ISCHEMIC_STROKE',
        swallowingScreeningPerformed: true,
        timeOfSwallowingScreening: addMinutes(admissionTime, 25), // 25 min after registration
        swallowingScreeningResult: 'FAIL',
        ctScanPerformed: true,
        timeOfCtScanStart: addMinutes(admissionTime, 22), // 22 min after registration
        timeOfCtReportFinal: addMinutes(admissionTime, 35), // 35 min after registration
        ctFindings: 'NORMAL',
        lvoDetected: true,
        
        // Treatment Details
        candidateForIVThrombolysis: 'YES',
        thrombolysisOrderTime: addMinutes(admissionTime, 40), // 40 min after registration
        ivThrombolysisAdministrationTime: addMinutes(admissionTime, 55), // 55 min after registration
        ivThrombolysisGiven: 'YES',
        reasonForNotAdministeringIV: null,
        candidateForMechanicalThrombectomy: 'YES',
        timeOfMechanicalThrombectomyPuncture: addMinutes(admissionTime, 110), // 110 min after registration
        mechanicalThrombectomyPerformed: true,
        timeOfThrombectomyComplete: addMinutes(admissionTime, 180), // 180 min after registration
        
        // Disposition & Transfer Decisions
        facilityHasCt: true,
        transferToAnotherHospital: false,
        timeOfTransferActivation: null,
        timeOfTransferDeparture: null,
        prehospitalNotificationBySrca: true,
        prehospitalNotificationByUccPhc: false,
        disposition: 'STROKE_UNIT',
        referralTo: ['STROKE_UNIT'],
        admittedToStrokeUnit: true,
        
        // Follow-up & Outcome Tracking
        followUpContactAttempted: true,
        modifiedRankinScaleAt90Days: 'SCORE_2',
        
        // Legacy fields
        strokeSubtype: 'LARGE_VESSEL_OCCLUSION',
        eligibleForThrombolysis: true,
        thrombolysisContraindications: null,
        eligibleForThrombectomy: true,
        thrombectomyContraindications: null,
        pathwayStarted: addMinutes(admissionTime, 8),
        pathwayCompleted: addMinutes(admissionTime, 75),
        strokeUnitAdmissionTime: addMinutes(admissionTime, 120),
        symptomNeedleMinutes: 235, // 3h55min from symptom onset
        symptomToMechanicalThrombectomyMinutes: 290, // 4h50min from symptom onset
        imagingToNeedleMinutes: 33,
        imagingToMechanicalThrombectomyMinutes: 88,
        
        createdById: users[0].id,
      },
    });
    strokeCases.push(strokeCase);
  }

  // Scenario 3: Poor KPI performance (5 cases)
  for (let i = 10; i < 15; i++) {
    // Use a consistent base time (6 hours ago) to ensure realistic timing
    const baseTime = new Date();
    baseTime.setHours(baseTime.getHours() - 6);
    const admissionTime = new Date(baseTime);
    
    const strokeCase = await prisma.strokeCase.create({
      data: {
        ticketId: null,
        patientId: patients[i].id,
        originHospitalId: hospitals[2].id,
        destinationHospitalId: null,
        
        // Basic Information
        strokeType: 'ISCHEMIC',
        currentStatus: 'TREATMENT_EVALUATION',
        selectedTreatment: 'CONSERVATIVE_MANAGEMENT',
        
        // Patient Arrival & Timing - POOR PERFORMANCE
        modeOfArrival: 'PRIVATE_CAR',
        srcaCallTime: null, // No SRCA call
        timeOfSymptomOnset: addMinutes(admissionTime, -300), // 5 hours before arrival
        lastKnownNormal: addMinutes(admissionTime, -300),
        dateOfAdmission: admissionTime,
        timeOfTriage: addMinutes(admissionTime, 15), // 15 min after registration
        timeOfPhysicianAssessment: addMinutes(admissionTime, 45), // 45 min after registration
        
        // Clinical Assessment & Diagnosis
        strokeTypeDetailed: 'ISCHEMIC_STROKE',
        swallowingScreeningPerformed: false, // Not performed
        timeOfSwallowingScreening: null,
        swallowingScreeningResult: null,
        ctScanPerformed: true,
        timeOfCtScanStart: addMinutes(admissionTime, 50), // 50 min after registration
        timeOfCtReportFinal: addMinutes(admissionTime, 70), // 70 min after registration
        ctFindings: 'NORMAL',
        lvoDetected: false,
        
        // Treatment Details
        candidateForIVThrombolysis: 'NO',
        thrombolysisOrderTime: null,
        ivThrombolysisAdministrationTime: null,
        ivThrombolysisGiven: 'NO',
        reasonForNotAdministeringIV: 'Outside treatment window',
        candidateForMechanicalThrombectomy: 'NO',
        timeOfMechanicalThrombectomyPuncture: null,
        mechanicalThrombectomyPerformed: false,
        timeOfThrombectomyComplete: null,
        
        // Disposition & Transfer Decisions
        facilityHasCt: true,
        transferToAnotherHospital: false,
        timeOfTransferActivation: null,
        timeOfTransferDeparture: null,
        prehospitalNotificationBySrca: false,
        prehospitalNotificationByUccPhc: false,
        disposition: 'INPATIENT_WARD',
        referralTo: ['NEUROLOGY'],
        admittedToStrokeUnit: false,
        
        // Follow-up & Outcome Tracking
        followUpContactAttempted: false, // Not attempted
        modifiedRankinScaleAt90Days: null, // No follow-up
        
        // Legacy fields
        strokeSubtype: 'SMALL_VESSEL_DISEASE',
        eligibleForThrombolysis: false,
        thrombolysisContraindications: 'Outside treatment window',
        eligibleForThrombectomy: false,
        thrombectomyContraindications: 'No LVO',
        pathwayStarted: addMinutes(admissionTime, 20),
        pathwayCompleted: addMinutes(admissionTime, 120),
        strokeUnitAdmissionTime: null,
        symptomNeedleMinutes: null,
        symptomToMechanicalThrombectomyMinutes: null,
        imagingToNeedleMinutes: null,
        imagingToMechanicalThrombectomyMinutes: null,
        
        createdById: users[0].id,
      },
    });
    strokeCases.push(strokeCase);
  }

  // Scenario 4: Mixed performance (5 cases)
  for (let i = 15; i < 20; i++) {
    // Use a consistent base time (8 hours ago) to ensure realistic timing
    const baseTime = new Date();
    baseTime.setHours(baseTime.getHours() - 8);
    const admissionTime = new Date(baseTime);
    
    const strokeCase = await prisma.strokeCase.create({
      data: {
        ticketId: null,
        patientId: patients[i].id,
        originHospitalId: hospitals[0].id,
        destinationHospitalId: hospitals[1].id,
        
        // Basic Information
        strokeType: getRandomItem(['ISCHEMIC', 'HEMORRHAGIC', 'TIA']),
        currentStatus: 'TREATMENT_COMPLETE',
        selectedTreatment: getRandomItem(['IV_THROMBOLYSIS', 'MECHANICAL_THROMBECTOMY', 'CONSERVATIVE_MANAGEMENT']),
        
        // Patient Arrival & Timing - MIXED PERFORMANCE
        modeOfArrival: getRandomItem(['AMBULANCE_RED_CRESCENT', 'TRANSFERRED_FROM_ANOTHER_HOSPITAL', 'PRIVATE_CAR']),
        srcaCallTime: randomBoolean(0.7) ? addMinutes(admissionTime, -60) : null,
        timeOfSymptomOnset: addMinutes(admissionTime, -180), // 3 hours before arrival
        lastKnownNormal: addMinutes(admissionTime, -180),
        dateOfAdmission: admissionTime,
        timeOfTriage: addMinutes(admissionTime, 5), // 5 min after registration
        timeOfPhysicianAssessment: addMinutes(admissionTime, 20), // 20 min after registration
        
        // Clinical Assessment & Diagnosis
        strokeTypeDetailed: getRandomItem(['ISCHEMIC_STROKE', 'HEMORRHAGIC_STROKE', 'TRANSIENT_ISCHEMIC_ATTACK_TIA']),
        swallowingScreeningPerformed: randomBoolean(0.8),
        timeOfSwallowingScreening: randomBoolean(0.8) ? addMinutes(admissionTime, 25) : null,
        swallowingScreeningResult: randomBoolean(0.8) ? getRandomItem(['PASS', 'FAIL', 'NOT_APPLICABLE']) : null,
        ctScanPerformed: true,
        timeOfCtScanStart: addMinutes(admissionTime, 25), // 25 min after registration
        timeOfCtReportFinal: addMinutes(admissionTime, 35), // 35 min after registration
        ctFindings: getRandomItem(['NORMAL', 'HEMORRHAGE', 'ISCHEMIC_CHANGES']),
        lvoDetected: randomBoolean(0.3),
        
        // Treatment Details
        candidateForIVThrombolysis: getRandomItem(['YES', 'NO']),
        thrombolysisOrderTime: null, // Will be set conditionally below
        ivThrombolysisAdministrationTime: null, // Will be set conditionally below
        ivThrombolysisGiven: getRandomItem(['YES', 'NO']),
        reasonForNotAdministeringIV: randomBoolean(0.4) ? 'Contraindications present' : null,
        candidateForMechanicalThrombectomy: getRandomItem(['YES', 'NO']),
        timeOfMechanicalThrombectomyPuncture: randomBoolean(0.4) ? addMinutes(admissionTime, 90) : null,
        mechanicalThrombectomyPerformed: randomBoolean(0.4),
        timeOfThrombectomyComplete: randomBoolean(0.4) ? addMinutes(admissionTime, 150) : null,
        
        // Disposition & Transfer Decisions
        facilityHasCt: randomBoolean(0.8),
        transferToAnotherHospital: randomBoolean(0.3),
        timeOfTransferActivation: randomBoolean(0.3) ? addMinutes(admissionTime, 60) : null,
        timeOfTransferDeparture: randomBoolean(0.3) ? addMinutes(admissionTime, 90) : null,
        prehospitalNotificationBySrca: randomBoolean(0.6),
        prehospitalNotificationByUccPhc: randomBoolean(0.4),
        disposition: getRandomItem(['STROKE_UNIT', 'INPATIENT_WARD', 'DISCHARGED_HOME']),
        referralTo: getRandomItem([['STROKE_UNIT'], ['NEUROLOGY'], ['OTHER']]),
        admittedToStrokeUnit: randomBoolean(0.7),
        
        // Follow-up & Outcome Tracking
        followUpContactAttempted: randomBoolean(0.8),
        modifiedRankinScaleAt90Days: randomBoolean(0.8) ? getRandomItem(['SCORE_0', 'SCORE_2', 'SCORE_4', 'SCORE_6_DEAD']) : null,
        
        // Legacy fields
        strokeSubtype: getRandomItem(['LARGE_VESSEL_OCCLUSION', 'SMALL_VESSEL_DISEASE', 'CARDIOEMBOLIC']),
        eligibleForThrombolysis: randomBoolean(0.6),
        thrombolysisContraindications: randomBoolean(0.3) ? 'Contraindications present' : null,
        eligibleForThrombectomy: randomBoolean(0.4),
        thrombectomyContraindications: randomBoolean(0.3) ? 'No LVO detected' : null,
        pathwayStarted: addMinutes(admissionTime, 8),
        pathwayCompleted: addMinutes(admissionTime, 75),
        strokeUnitAdmissionTime: randomBoolean(0.7) ? addMinutes(admissionTime, 120) : null,
        symptomNeedleMinutes: randomBoolean(0.6) ? 240 : null, // 4 hours from symptom onset
        symptomToMechanicalThrombectomyMinutes: randomBoolean(0.4) ? 300 : null, // 5 hours from symptom onset
        imagingToNeedleMinutes: randomBoolean(0.6) ? 35 : null,
        imagingToMechanicalThrombectomyMinutes: randomBoolean(0.4) ? 85 : null,
        
        createdById: users[0].id,
      },
    });
    
    // Set conditional timing fields based on candidate status for mixed performance cases
    if (strokeCase.candidateForIVThrombolysis === 'YES') {
      await prisma.strokeCase.update({
        where: { id: strokeCase.id },
        data: {
          thrombolysisOrderTime: addMinutes(admissionTime, 40),
          ivThrombolysisAdministrationTime: addMinutes(admissionTime, 55),
        }
      });
    }
    
    strokeCases.push(strokeCase);
  }

  console.log(`🧠 Created ${strokeCases.length} stroke cases with varied KPI performance`);

  // Now let's calculate and update the KPIs for each case
  console.log('📊 Calculating KPIs for all cases...');
  
  for (const strokeCase of strokeCases) {
    // Refresh the stroke case data to get the updated timing fields
    const updatedStrokeCase = await prisma.strokeCase.findUnique({
      where: { id: strokeCase.id }
    });
    
    if (!updatedStrokeCase) continue;
    
    // Calculate KPI timing values
    const kpiData: any = {};
    
    // KPI 1: Door to physician (registration to physician assessment)
    if (updatedStrokeCase.dateOfAdmission && updatedStrokeCase.timeOfPhysicianAssessment) {
      const doorToPhysicianMs = updatedStrokeCase.timeOfPhysicianAssessment.getTime() - updatedStrokeCase.dateOfAdmission.getTime();
      kpiData.doorToPhysicianMinutes = Math.round(doorToPhysicianMs / (1000 * 60));
      kpiData.metKpi1 = kpiData.doorToPhysicianMinutes <= 15;
    }
    
    // KPI 2: Pre-hospital notification
    kpiData.metKpi2 = updatedStrokeCase.prehospitalNotificationBySrca || updatedStrokeCase.prehospitalNotificationByUccPhc;
    
    // KPI 3: Registration to CT scan
    if (updatedStrokeCase.dateOfAdmission && updatedStrokeCase.timeOfCtScanStart) {
      const registrationToCtMs = updatedStrokeCase.timeOfCtScanStart.getTime() - updatedStrokeCase.dateOfAdmission.getTime();
      kpiData.registrationToCtMinutes = Math.round(registrationToCtMs / (1000 * 60));
      kpiData.metKpi3 = kpiData.registrationToCtMinutes <= 20;
    }
    
    // Door to CT Report
    if (updatedStrokeCase.dateOfAdmission && updatedStrokeCase.timeOfCtReportFinal) {
      const doorToCtReportMs = updatedStrokeCase.timeOfCtReportFinal.getTime() - updatedStrokeCase.dateOfAdmission.getTime();
      kpiData.doorToCtReportMinutes = Math.round(doorToCtReportMs / (1000 * 60));
    }
    
    // Door to Thrombolysis Order
    if (updatedStrokeCase.dateOfAdmission && updatedStrokeCase.thrombolysisOrderTime) {
      const doorToThrombolysisOrderMs = updatedStrokeCase.thrombolysisOrderTime.getTime() - updatedStrokeCase.dateOfAdmission.getTime();
      kpiData.doorToThrombolysisOrderMinutes = Math.round(doorToThrombolysisOrderMs / (1000 * 60));
    }
    
    // KPI 4: Registration to IV thrombolysis
    if (updatedStrokeCase.dateOfAdmission && updatedStrokeCase.ivThrombolysisAdministrationTime) {
      const registrationToThrombolysisMs = updatedStrokeCase.ivThrombolysisAdministrationTime.getTime() - updatedStrokeCase.dateOfAdmission.getTime();
      kpiData.registrationToThrombolysisMinutes = Math.round(registrationToThrombolysisMs / (1000 * 60));
      kpiData.metKpi4 = kpiData.registrationToThrombolysisMinutes <= 60;
    }
    
    // KPI 5: IV thrombolysis rate (for eligible patients)
    if (updatedStrokeCase.strokeType === 'ISCHEMIC' && updatedStrokeCase.candidateForIVThrombolysis === 'YES') {
      kpiData.metKpi5 = updatedStrokeCase.ivThrombolysisGiven === 'YES';
    }
    
    // KPI 6: Direct stroke unit admission
    kpiData.metKpi6 = updatedStrokeCase.admittedToStrokeUnit === true;
    
    // KPI 7: Transfer time
    if (updatedStrokeCase.timeOfTransferActivation && updatedStrokeCase.timeOfTransferDeparture) {
      const transferMs = updatedStrokeCase.timeOfTransferDeparture.getTime() - updatedStrokeCase.timeOfTransferActivation.getTime();
      kpiData.transferActivationToDepartureMinutes = Math.round(transferMs / (1000 * 60));
      // Target: ≤20 min (no CT), ≤40 min (with CT)
      const target = updatedStrokeCase.facilityHasCt ? 40 : 20;
      kpiData.metKpi7 = kpiData.transferActivationToDepartureMinutes <= target;
    }
    
    // KPI 8: Registration to mechanical thrombectomy puncture
    if (updatedStrokeCase.dateOfAdmission && updatedStrokeCase.timeOfMechanicalThrombectomyPuncture) {
      const registrationToMechanicalThrombectomyMs = updatedStrokeCase.timeOfMechanicalThrombectomyPuncture.getTime() - updatedStrokeCase.dateOfAdmission.getTime();
      kpiData.registrationToMechanicalThrombectomyMinutes = Math.round(registrationToMechanicalThrombectomyMs / (1000 * 60));
      kpiData.metKpi8 = kpiData.registrationToMechanicalThrombectomyMinutes <= 120;
    }
    
    // KPI 9: SRCA call to arrival
    if (updatedStrokeCase.srcaCallTime && updatedStrokeCase.dateOfAdmission) {
      const srcaCallToArrivalMs = updatedStrokeCase.dateOfAdmission.getTime() - updatedStrokeCase.srcaCallTime.getTime();
      kpiData.srcaCallToArrivalMinutes = Math.round(srcaCallToArrivalMs / (1000 * 60));
      kpiData.metKpi9 = kpiData.srcaCallToArrivalMinutes <= 60;
    }
    
    // KPI 10: Swallowing screening within 4 hours
    if (updatedStrokeCase.dateOfAdmission && updatedStrokeCase.timeOfSwallowingScreening) {
      const screeningMs = updatedStrokeCase.timeOfSwallowingScreening.getTime() - updatedStrokeCase.dateOfAdmission.getTime();
      const screeningMinutes = Math.round(screeningMs / (1000 * 60));
      kpiData.swallowingScreeningWithin4Hours = screeningMinutes <= 240; // 4 hours = 240 minutes
      kpiData.metKpi10 = kpiData.swallowingScreeningWithin4Hours;
    } else {
      kpiData.swallowingScreeningWithin4Hours = false;
      kpiData.metKpi10 = false;
    }
    
    // KPI 11: 3-month follow-up with mRS
    kpiData.metKpi11 = updatedStrokeCase.modifiedRankinScaleAt90Days !== null;
    
    // Update the stroke case with KPI data
    await prisma.strokeCase.update({
      where: { id: strokeCase.id },
      data: kpiData,
    });
  }

  console.log('✅ Stroke KPI Test Seed completed successfully!');
  console.log('📊 Created stroke cases with varied KPI performance:');
  console.log('   - 5 cases with EXCELLENT KPI performance');
  console.log('   - 5 cases with GOOD KPI performance');
  console.log('   - 5 cases with POOR KPI performance');
  console.log('   - 5 cases with MIXED KPI performance');
  console.log('🎯 All 11 KPIs have been calculated and stored');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
