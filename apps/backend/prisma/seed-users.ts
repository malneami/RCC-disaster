import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function seedUsers() {
  console.log('👥 Seeding users...');
  
  // Get hospital IDs
  const hospitals = await prisma.hospital.findMany({
    select: { id: true, name: true }
  });
  
  const kfch = hospitals.find(h => h.name.includes('King Fahad Central Hospital'));
  const jgh = hospitals.find(h => h.name.includes('Jazan General Hospital'));
  
  if (!kfch || !jgh) {
    console.error('❌ Required hospitals not found. Please seed hospitals first.');
    return;
  }
  
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
      hospitalId: kfch.id, // KFCH
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
