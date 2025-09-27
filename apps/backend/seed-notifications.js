const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedNotifications() {
  console.log('🔔 Starting notification seeding...');
  
  try {
    // Get existing users and patients
    const users = await prisma.user.findMany({
      select: { id: true, email: true, firstName: true, lastName: true }
    });
    
    const patients = await prisma.patient.findMany({
      select: { id: true, firstName: true, lastName: true }
    });
    
    console.log(`Found ${users.length} users and ${patients.length} patients`);
    
    if (users.length === 0 || patients.length === 0) {
      console.log('❌ No users or patients found. Please run the main seed first.');
      return;
    }
    
    // Get the first user and patient for testing
    const testUser = users[0];
    const testPatient = patients[0];
    
    console.log(`Using user: ${testUser.email} (${testUser.id})`);
    console.log(`Using patient: ${testPatient.firstName} ${testPatient.lastName} (${testPatient.id})`);
    
    // Create test notifications
    const notifications = [
      {
        type: 'CASE_UPDATE',
        priority: 'HIGH',
        title: 'Critical STEMI Case Update',
        message: 'Patient requires immediate attention - Door to balloon time critical',
        caseType: 'STEMI',
        caseId: 'stemi-case-001',
        patientId: testPatient.id,
        patientName: `${testPatient.firstName} ${testPatient.lastName}`,
        createdById: testUser.id,
        recipients: {
          create: [
            {
              userId: testUser.id,
              deliveryStatus: 'DELIVERED',
              deliveryMethod: 'IN_APP',
              isRead: false
            }
          ]
        }
      },
      {
        type: 'CASE_ESCALATION',
        priority: 'MEDIUM',
        title: 'Stroke Case Alert',
        message: 'New stroke case registered - NIHSS score 15',
        caseType: 'STROKE',
        caseId: 'stroke-case-001',
        patientId: testPatient.id,
        patientName: `${testPatient.firstName} ${testPatient.lastName}`,
        createdById: testUser.id,
        recipients: {
          create: [
            {
              userId: testUser.id,
              deliveryStatus: 'DELIVERED',
              deliveryMethod: 'IN_APP',
              isRead: true,
              readAt: new Date()
            }
          ]
        }
      },
      {
        type: 'CASE_COMMENT',
        priority: 'LOW',
        title: 'System Maintenance',
        message: 'Scheduled maintenance window tonight 2-4 AM',
        caseType: 'TRAUMA',
        caseId: 'system-001',
        patientId: testPatient.id,
        patientName: `${testPatient.firstName} ${testPatient.lastName}`,
        createdById: testUser.id,
        recipients: {
          create: [
            {
              userId: testUser.id,
              deliveryStatus: 'PENDING',
              deliveryMethod: 'IN_APP',
              isRead: false
            }
          ]
        }
      }
    ];
    
    // Create notifications
    for (const notificationData of notifications) {
      try {
        const notification = await prisma.notification.create({
          data: notificationData,
          include: {
            recipients: true,
            createdBy: {
              select: { id: true, firstName: true, lastName: true, email: true }
            }
          }
        });
        
        console.log(`✅ Created notification: ${notification.title} (${notification.id})`);
      } catch (error) {
        console.error(`❌ Failed to create notification: ${notificationData.title}`);
        console.error('Error:', error.message);
      }
    }
    
    // Check final count
    const totalNotifications = await prisma.notification.count();
    const totalRecipients = await prisma.notificationRecipient.count();
    
    console.log(`🎉 Seeding completed! Total notifications: ${totalNotifications}, Total recipients: ${totalRecipients}`);
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedNotifications();
