import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function seedUsers() {
  console.log('👥 Seeding users...');

  // Get hospital IDs
  const hospitals = await prisma.hospital.findMany({
    select: { id: true, name: true }
  });

  const kfch = hospitals.find(h => h.name.includes('King Fahad Central Hospital') || h.name.includes('King Fahd Central Hospital'));
  const jgh = hospitals.find(h => h.name.includes('Jazan General Hospital'));
  const pmnh = hospitals.find(h => h.name.includes('Prince Mohammed') || h.name.includes('PMNH'));

  if (!kfch || !jgh) {
    console.error('❌ Required hospitals not found. Please seed hospitals first.');
    return;
  }

  // Use PMNH if found, otherwise use first available hospital as fallback
  const pmnhId = pmnh?.id || hospitals.find(h => h.id !== kfch.id && h.id !== jgh.id)?.id || kfch.id;

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
      hospitalId: kfch.id, // KFCH
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
      hospitalId: kfch.id, // KFCH
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
      hospitalId: jgh.id, // JGH
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
      hospitalId: pmnhId, // PMNH
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
      hospitalId: kfch.id, // KFCH
    },
    {
      email: 'hospitaluser@rcc-healthcare.com',
      firstName: 'Hospital',
      lastName: 'User',
      phoneNumber: '+966 50 000 0006',
      role: UserRole.HOSPITAL_USER,
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
      passwordHash: passwordHash,
      hospitalId: kfch.id, // KFCH
    },
    // ED Nurses - Multiple per hospital
    {
      email: 'ednurse1.jgh@rcc-healthcare.com',
      firstName: 'ED',
      lastName: 'Nurse',
      phoneNumber: '+966 50 000 0101',
      role: UserRole.ED_NURSE,
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
      passwordHash: passwordHash,
      hospitalId: jgh.id, // JGH
    },
    {
      email: 'ednurse2.jgh@rcc-healthcare.com',
      firstName: 'ED',
      lastName: 'Nurse',
      phoneNumber: '+966 50 000 0102',
      role: UserRole.ED_NURSE,
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
      passwordHash: passwordHash,
      hospitalId: jgh.id, // JGH
    },
    {
      email: 'ednurse1.kfch@rcc-healthcare.com',
      firstName: 'ED',
      lastName: 'Nurse',
      phoneNumber: '+966 50 000 0103',
      role: UserRole.ED_NURSE,
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
      passwordHash: passwordHash,
      hospitalId: kfch.id, // KFCH
    },
    {
      email: 'ednurse2.kfch@rcc-healthcare.com',
      firstName: 'ED',
      lastName: 'Nurse',
      phoneNumber: '+966 50 000 0104',
      role: UserRole.ED_NURSE,
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
      passwordHash: passwordHash,
      hospitalId: kfch.id, // KFCH
    },
    {
      email: 'ednurse1.pmnh@rcc-healthcare.com',
      firstName: 'ED',
      lastName: 'Nurse',
      phoneNumber: '+966 50 000 0105',
      role: UserRole.ED_NURSE,
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
      passwordHash: passwordHash,
      hospitalId: pmnhId, // PMNH
    },
    {
      email: 'ednurse2.pmnh@rcc-healthcare.com',
      firstName: 'ED',
      lastName: 'Nurse',
      phoneNumber: '+966 50 000 0106',
      role: UserRole.ED_NURSE,
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
      passwordHash: passwordHash,
      hospitalId: pmnhId, // PMNH
    },
    // Nurses - Multiple per hospital
    {
      email: 'nurse1.jgh@rcc-healthcare.com',
      firstName: 'Unit',
      lastName: 'Nurse',
      phoneNumber: '+966 50 000 0201',
      role: UserRole.UNIT_NURSE,
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
      passwordHash: passwordHash,
      hospitalId: jgh.id, // JGH
    },
    {
      email: 'nurse2.jgh@rcc-healthcare.com',
      firstName: 'Unit',
      lastName: 'Nurse',
      phoneNumber: '+966 50 000 0202',
      role: UserRole.UNIT_NURSE,
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
      passwordHash: passwordHash,
      hospitalId: jgh.id, // JGH
    },
    {
      email: 'nurse1.kfch@rcc-healthcare.com',
      firstName: 'Unit',
      lastName: 'Nurse',
      phoneNumber: '+966 50 000 0203',
      role: UserRole.UNIT_NURSE,
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
      passwordHash: passwordHash,
      hospitalId: kfch.id, // KFCH
    },
    {
      email: 'nurse2.kfch@rcc-healthcare.com',
      firstName: 'Unit',
      lastName: 'Nurse',
      phoneNumber: '+966 50 000 0204',
      role: UserRole.UNIT_NURSE,
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
      passwordHash: passwordHash,
      hospitalId: kfch.id, // KFCH
    },
    {
      email: 'nurse3.kfch@rcc-healthcare.com',
      firstName: 'Unit',
      lastName: 'Nurse',
      phoneNumber: '+966 50 000 0205',
      role: UserRole.UNIT_NURSE,
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
      passwordHash: passwordHash,
      hospitalId: kfch.id, // KFCH
    },
    {
      email: 'nurse1.pmnh@rcc-healthcare.com',
      firstName: 'Unit',
      lastName: 'Nurse',
      phoneNumber: '+966 50 000 0206',
      role: UserRole.UNIT_NURSE,
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
      passwordHash: passwordHash,
      hospitalId: pmnhId, // PMNH
    },
    {
      email: 'nurse2.pmnh@rcc-healthcare.com',
      firstName: 'Unit',
      lastName: 'Nurse',
      phoneNumber: '+966 50 000 0207',
      role: UserRole.UNIT_NURSE,
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
      passwordHash: passwordHash,
      hospitalId: pmnhId, // PMNH
    },
    // Bed Coordinators - One per hospital (typically one coordinator per hospital)
    {
      email: 'bedcoordinator.jgh@rcc-healthcare.com',
      firstName: 'Bed',
      lastName: 'Coordinator',
      phoneNumber: '+966 50 000 0301',
      role: UserRole.BED_COORDINATOR,
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
      passwordHash: passwordHash,
      hospitalId: jgh.id, // JGH
    },
    {
      email: 'bedcoordinator.kfch@rcc-healthcare.com',
      firstName: 'Bed',
      lastName: 'Coordinator',
      phoneNumber: '+966 50 000 0302',
      role: UserRole.BED_COORDINATOR,
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
      passwordHash: passwordHash,
      hospitalId: kfch.id, // KFCH
    },
    {
      email: 'bedcoordinator.pmnh@rcc-healthcare.com',
      firstName: 'Bed',
      lastName: 'Coordinator',
      phoneNumber: '+966 50 000 0303',
      role: UserRole.BED_COORDINATOR,
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
      passwordHash: passwordHash,
      hospitalId: pmnhId, // PMNH
    },
    // Support Team
    {
      email: 'support@rcc-healthcare.com',
      firstName: 'Support',
      lastName: 'Team',
      phoneNumber: '+966 50 000 0401',
      role: UserRole.SUPPORT,
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
      passwordHash: passwordHash,
      hospitalId: kfch.id, 
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
