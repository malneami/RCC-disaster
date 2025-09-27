const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugNotifications() {
  console.log('🔍 Debugging notifications...');
  
  try {
    // Test basic notification query
    console.log('\n1. Testing basic notification query...');
    const notifications = await prisma.notification.findMany({
      take: 2
    });
    console.log(`Found ${notifications.length} notifications`);
    
    // Test notification with recipients
    console.log('\n2. Testing notification with recipients...');
    const notificationsWithRecipients = await prisma.notification.findMany({
      include: {
        recipients: true
      },
      take: 1
    });
    console.log(`Found ${notificationsWithRecipients.length} notifications with recipients`);
    if (notificationsWithRecipients.length > 0) {
      console.log('First notification recipients:', notificationsWithRecipients[0].recipients.length);
    }
    
    // Test notification with patient
    console.log('\n3. Testing notification with patient...');
    try {
      const notificationsWithPatient = await prisma.notification.findMany({
        include: {
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              age: true,
              gender: true,
            },
          }
        },
        take: 1
      });
      console.log(`✅ Patient relation works! Found ${notificationsWithPatient.length} notifications with patient`);
    } catch (error) {
      console.log('❌ Patient relation failed:', error.message);
    }
    
    // Test notification with createdBy
    console.log('\n4. Testing notification with createdBy...');
    try {
      const notificationsWithCreatedBy = await prisma.notification.findMany({
        include: {
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          }
        },
        take: 1
      });
      console.log(`✅ CreatedBy relation works! Found ${notificationsWithCreatedBy.length} notifications with createdBy`);
    } catch (error) {
      console.log('❌ CreatedBy relation failed:', error.message);
    }
    
    // Test the exact query from the service
    console.log('\n5. Testing exact service query...');
    const userId = 'dabb1aa8-76c2-4b00-a9f2-f787eebf9299';
    
    try {
      const where = {
        recipients: {
          some: {
            userId,
            deletedAt: null,
          },
        },
      };
      
      const serviceQuery = await prisma.notification.findMany({
        where,
        include: {
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          recipients: {
            where: { 
              userId,
              deletedAt: null,
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
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              age: true,
              gender: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });
      
      console.log(`✅ Service query works! Found ${serviceQuery.length} notifications`);
      
      // Transform like the service does
      const transformedNotifications = serviceQuery.map(notification => {
        const userRecipient = notification.recipients.find(r => r.userId === userId);
        return {
          ...notification,
          isRead: userRecipient?.isRead || false,
          readAt: userRecipient?.readAt || null,
          recipients: undefined,
        };
      });
      
      console.log(`✅ Transformation works! Transformed ${transformedNotifications.length} notifications`);
      
    } catch (error) {
      console.log('❌ Service query failed:', error.message);
      console.log('Full error:', error);
    }
    
    // Test notification creation
    console.log('\n6. Testing notification creation...');
    try {
      const testNotification = await prisma.notification.create({
        data: {
          type: 'CASE_UPDATE',
          priority: 'HIGH',
          title: 'Debug Test Notification',
          message: 'This is a debug test',
          caseType: 'STEMI',
          caseId: 'debug-test-001',
          patientId: 'caccf08d-561b-4c18-b5d2-34e44953d3a6',
          patientName: 'Debug Test Patient',
          createdById: userId,
          recipients: {
            create: [
              {
                userId: userId,
                deliveryStatus: 'DELIVERED',
                deliveryMethod: 'IN_APP',
                isRead: false
              }
            ]
          }
        },
        include: {
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          recipients: {
            select: {
              id: true,
              userId: true,
              isRead: true,
              readAt: true,
              deliveryStatus: true,
              deliveryMethod: true,
            },
          },
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              age: true,
              gender: true,
            },
          },
        },
      });
      
      console.log(`✅ Notification creation works! Created: ${testNotification.title} (${testNotification.id})`);
      
    } catch (error) {
      console.log('❌ Notification creation failed:', error.message);
      console.log('Full error:', error);
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugNotifications();
