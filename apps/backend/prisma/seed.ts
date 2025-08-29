import { PrismaClient, UserRole, HospitalType, ServiceType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create hospitals
  const generalHospital = await prisma.hospital.create({
    data: {
      name: 'General Regional Medical Center',
      code: 'GRMC',
      address: '123 Medical Drive',
      city: 'Healthcare City',
      state: 'CA',
      zipCode: '90210',
      phoneNumber: '555-0100',
      type: HospitalType.TERTIARY,
      capacity: 300,
      availableBeds: 45,
      hasEmergencyDept: true,
      hasCathLab: true,
      hasStrokeCenter: true,
      hasTraumaCenter: true,
      traumaLevel: 1,
      latitude: 34.0522,
      longitude: -118.2437,
    },
  });

  const specialtyHospital = await prisma.hospital.create({
    data: {
      name: 'Heart & Stroke Specialty Center',
      code: 'HSSC',
      address: '456 Cardiac Boulevard',
      city: 'Healthcare City',
      state: 'CA',
      zipCode: '90211',
      phoneNumber: '555-0200',
      type: HospitalType.SPECIALTY,
      capacity: 150,
      availableBeds: 20,
      hasEmergencyDept: false,
      hasCathLab: true,
      hasStrokeCenter: true,
      hasTraumaCenter: false,
      latitude: 34.0722,
      longitude: -118.2637,
    },
  });

  // Create hospital services
  await prisma.hospitalService.createMany({
    data: [
      {
        hospitalId: generalHospital.id,
        service: ServiceType.STEMI,
        isAvailable: true,
        capacity: 10,
      },
      {
        hospitalId: generalHospital.id,
        service: ServiceType.STROKE,
        isAvailable: true,
        capacity: 8,
      },
      {
        hospitalId: generalHospital.id,
        service: ServiceType.TRAUMA,
        isAvailable: true,
        capacity: 15,
      },
      {
        hospitalId: specialtyHospital.id,
        service: ServiceType.STEMI,
        isAvailable: true,
        capacity: 12,
      },
      {
        hospitalId: specialtyHospital.id,
        service: ServiceType.STROKE,
        isAvailable: true,
        capacity: 10,
      },
    ],
  });

  // Hash password for development
  const hashedPassword = await bcrypt.hash('Healthcare@2024', 12);

  // Create admin user
  await prisma.user.create({
    data: {
      email: 'admin@rcc-healthcare.com',
      firstName: 'System',
      lastName: 'Administrator',
      phoneNumber: '555-0001',
      role: UserRole.ADMIN,
      passwordHash: hashedPassword,
      isEmailVerified: true,
    },
  });

  // Create RCC coordinator
  await prisma.user.create({
    data: {
      email: 'coordinator@rcc-healthcare.com',
      firstName: 'Regional',
      lastName: 'Coordinator',
      phoneNumber: '555-0002',
      role: UserRole.RCC,
      passwordHash: hashedPassword,
      isEmailVerified: true,
    },
  });

  // Create EMS user
  await prisma.user.create({
    data: {
      email: 'ems@rcc-healthcare.com',
      firstName: 'EMS',
      lastName: 'Dispatcher',
      phoneNumber: '555-0003',
      role: UserRole.EMS,
      passwordHash: hashedPassword,
      isEmailVerified: true,
    },
  });

  // Create data collector
  await prisma.user.create({
    data: {
      email: 'datacollector@rcc-healthcare.com',
      firstName: 'Data',
      lastName: 'Collector',
      phoneNumber: '555-0004',
      role: UserRole.DATA_COLLECTOR,
      passwordHash: hashedPassword,
      isEmailVerified: true,
      hospitalId: generalHospital.id,
    },
  });

  // Create cath lab user
  await prisma.user.create({
    data: {
      email: 'cathlab@rcc-healthcare.com',
      firstName: 'Cath Lab',
      lastName: 'Technician',
      phoneNumber: '555-0005',
      role: UserRole.CATH_LAB_USER,
      passwordHash: hashedPassword,
      isEmailVerified: true,
      hospitalId: specialtyHospital.id,
    },
  });

  // Create system configuration
  await prisma.systemConfig.createMany({
    data: [
      {
        key: 'SESSION_TIMEOUT_MINUTES',
        value: '30',
        description: 'User session timeout in minutes',
      },
      {
        key: 'MAX_LOGIN_ATTEMPTS',
        value: '5',
        description: 'Maximum failed login attempts before account lockout',
      },
      {
        key: 'LOCKOUT_DURATION_MINUTES',
        value: '15',
        description: 'Account lockout duration in minutes',
      },
      {
        key: 'PASSWORD_EXPIRY_DAYS',
        value: '90',
        description: 'Password expiration period in days',
      },
    ],
  });

  console.log('✅ Database seed completed successfully!');
  console.log('👤 Default users created:');
  console.log('   - admin@rcc-healthcare.com (Admin)');
  console.log('   - coordinator@rcc-healthcare.com (RCC)');
  console.log('   - ems@rcc-healthcare.com (EMS)');
  console.log('   - datacollector@rcc-healthcare.com (Data Collector)');
  console.log('   - cathlab@rcc-healthcare.com (Cath Lab User)');
  console.log('🔑 Default password for all users: Healthcare@2024');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });