const { PrismaClient } = require('@prisma/client');

async function testNotificationTable() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Testing notification table access...');
    
    // Test 1: Check if notification table exists
    const count = await prisma.notification.count();
    console.log(`✅ Notification table exists, count: ${count}`);
    
    // Test 2: Try to find notifications for a specific user
    const userId = '927c6e65-7cfb-477c-8397-247e1b5504b1'; // admin user from local DB
    const notifications = await prisma.notification.findMany({
      where: {
        recipients: {
          some: {
            userId,
          },
        },
      },
      include: {
        recipients: {
          where: { 
            userId,
          },
          select: {
            id: true,
            userId: true,
            isRead: true,
            readAt: true,
            deliveryStatus: true,
            deliveryMethod: true,
          },
        },
      },
      take: 5,
    });
    
    console.log(`✅ Found ${notifications.length} notifications for user`);
    
    // Test 3: Check notification recipients table
    const recipientCount = await prisma.notificationRecipient.count();
    console.log(`✅ NotificationRecipient table exists, count: ${recipientCount}`);
    
    // Test 4: Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, status: true },
    });
    
    if (user) {
      console.log(`✅ User exists, status: ${user.status}`);
    } else {
      console.log('❌ User not found');
    }
    
  } catch (error) {
    console.error('❌ Error testing notification table:', error);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testNotificationTable();
