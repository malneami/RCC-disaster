
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@rcc-healthcare.com';
  console.log(`Checking user: ${email}...`);
  
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    console.error('❌ User not found!');
    return;
  }

  console.log('✅ User found:', user);
  
  // Test password
  const password = 'Healthcare@2024';
  const isValid = await bcrypt.compare(password, user.passwordHash);
  
  console.log(`Password validation result: ${isValid}`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
