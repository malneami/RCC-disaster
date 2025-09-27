const { PrismaClient } = require('@prisma/client');

async function getUsers() {
  const prisma = new PrismaClient();
  
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true
      },
      take: 5
    });
    
    console.log('Available users:');
    console.log(JSON.stringify(users, null, 2));
    
    return users;
  } catch (error) {
    console.error('Error fetching users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

getUsers();

