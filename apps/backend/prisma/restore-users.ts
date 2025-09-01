import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Restoring development users with correct credentials...');

  // Hash the password
  const passwordHash = await bcrypt.hash('Healthcare@2024', 10);

  // Development users with correct credentials
  const developmentUsers = [
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

  for (const user of developmentUsers) {
    try {
      await prisma.user.upsert({
        where: { email: user.email },
        update: {
          ...user,
          passwordHash: passwordHash, // Update password hash
        },
        create: user,
      });
      console.log(`✅ User ${user.email} restored/created successfully`);
    } catch (error) {
      console.log(`⚠️  Error with user ${user.email}:`, (error as Error).message);
    }
  }

  console.log('✅ Development user restoration completed!');
  console.log('📋 Login Credentials:');
  console.log('   Admin: admin@rcc-healthcare.com');
  console.log('   RCC: coordinator@rcc-healthcare.com');
  console.log('   EMS: ems@rcc-healthcare.com');
  console.log('   Data Collector: datacollector@rcc-healthcare.com');
  console.log('   Cath Lab: cathlab@rcc-healthcare.com');
  console.log('   Password: Healthcare@2024');
}

main()
  .catch((e) => {
    console.error('❌ Error restoring users:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
