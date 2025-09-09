import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: { email: true, role: true, firstName: true, lastName: true }
  });
  
  console.log('Users in database:');
  users.forEach(user => {
    console.log(`- ${user.email} (${user.role}): ${user.firstName} ${user.lastName}`);
  });
  
  const emsUsers = users.filter(u => u.role === 'EMS');
  console.log(`\nEMS users: ${emsUsers.length}`);
  emsUsers.forEach(user => {
    console.log(`- ${user.email}: ${user.firstName} ${user.lastName}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());


