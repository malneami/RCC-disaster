import { PrismaClient, HospitalStatus, TraumaLevel, CriticalCaseType, CriticalCaseSeverity, CriticalCaseStatus, HospitalTicketType, HospitalTicketStatus, TicketPriority, UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

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
      ventilators: 15,
      ventilatorsAvailable: 8,
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
      ventilators: 25,
      ventilatorsAvailable: 15,
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
      ventilators: 12,
      ventilatorsAvailable: 6,
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
      ventilators: 8,
      ventilatorsAvailable: 4,
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
      ventilators: 10,
      ventilatorsAvailable: 6,
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
      ventilators: 5,
      ventilatorsAvailable: 2,
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
      ventilators: 4,
      ventilatorsAvailable: 2,
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
      ventilators: 3,
      ventilatorsAvailable: 1,
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
      ventilators: 3,
      ventilatorsAvailable: 1,
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
      ventilators: 3,
      ventilatorsAvailable: 1,
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
      ventilators: 3,
      ventilatorsAvailable: 1,
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
      ventilators: 3,
      ventilatorsAvailable: 1,
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
      ventilators: 3,
      ventilatorsAvailable: 1,
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
      ventilators: 4,
      ventilatorsAvailable: 2,
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
      ventilators: 3,
      ventilatorsAvailable: 1,
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
      ventilators: 5,
      ventilatorsAvailable: 2,
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
      ventilators: 4,
      ventilatorsAvailable: 2,
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
      ventilators: 3,
      ventilatorsAvailable: 1,
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
      ventilators: 3,
      ventilatorsAvailable: 1,
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
      ventilators: 3,
      ventilatorsAvailable: 1,
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
      ventilators: 3,
      ventilatorsAvailable: 1,
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
      ventilators: 10,
      ventilatorsAvailable: 5,
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
      ventilators: 0,
      ventilatorsAvailable: 0,
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
      ventilators: 0,
      ventilatorsAvailable: 0,
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
      ventilators: 0,
      ventilatorsAvailable: 0,
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
      email: 'admin@rcc-healthcare.com',
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
      email: 'coordinator@rcc-healthcare.com',
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
      email: 'ems@rcc-healthcare.com',
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
      email: 'datacollector@rcc-healthcare.com',
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
      email: 'cathlab@rcc-healthcare.com',
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
      type: HospitalTicketType.RESOURCE,
      priority: TicketPriority.CRITICAL,
      status: HospitalTicketStatus.IN_PROGRESS,
      hospitalId: '2', // KFCH
      createdById: users[1].id, // RCC Coordinator
      assignedToId: users[4].id, // Cath Lab Technician
    },
    {
      title: 'Ventilator Maintenance Request',
      description: 'Scheduled maintenance for ventilator unit #3 - Requires immediate attention',
      type: HospitalTicketType.SYSTEM,
      priority: TicketPriority.HIGH,
      status: HospitalTicketStatus.OPEN,
      hospitalId: '1', // JGH
      createdById: users[2].id, // EMS Operator
    },
    // Consultation Tickets
    {
      title: 'Cardiologist Consultation',
      description: 'Request for cardiologist consultation for complex case requiring expert opinion',
      type: HospitalTicketType.CONSULTATION,
      priority: TicketPriority.HIGH,
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
      priority: TicketPriority.HIGH,
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
      type: HospitalTicketType.SYSTEM,
      priority: TicketPriority.MEDIUM,
      status: HospitalTicketStatus.RESOLVED,
      hospitalId: '2', // KFCH
      createdById: users[0].id, // Admin
      assignedToId: users[3].id, // Data Collector
    },
    {
      title: 'Network Connectivity Issue',
      description: 'Intermittent network connectivity issues affecting patient monitoring systems',
      type: HospitalTicketType.SYSTEM,
      priority: TicketPriority.HIGH,
      status: HospitalTicketStatus.OPEN,
      hospitalId: '5', // Abu Arish
      createdById: users[1].id, // RCC Coordinator
    },
    // Resolved Tickets
    {
      title: 'Equipment Calibration Complete',
      description: 'Annual calibration of medical equipment completed successfully',
      type: HospitalTicketType.SYSTEM,
      priority: TicketPriority.LOW,
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

main()
  .catch((e) => {
    console.error('❌ Error seeding data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
