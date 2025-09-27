const { PrismaClient } = require('@prisma/client');

async function createTestNotification() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Creating test notification...');
    
    // Get the admin user
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@rcc-healthcare.com' }
    });
    
    if (!adminUser) {
      console.error('Admin user not found');
      return;
    }
    
    console.log(`Admin user ID: ${adminUser.id}`);
    
    // Get another user for recipient
    const recipientUser = await prisma.user.findFirst({
      where: { 
        email: { not: 'admin@rcc-healthcare.com' }
      }
    });
    
    if (!recipientUser) {
      console.error('No recipient user found');
      return;
    }
    
    console.log(`Recipient user ID: ${recipientUser.id}`);
    
    // Get a patient
    const patient = await prisma.patient.findFirst();
    if (!patient) {
      console.error('No patient found');
      return;
    }
    console.log(`Patient ID: ${patient.id}`);
    
    // Create a test notification
    const notification = await prisma.notification.create({
      data: {
        type: 'CASE_COMMENT',
        priority: 'HIGH',
        title: 'Test Notification',
        message: 'This is a test notification for API testing',
        caseType: 'STEMI',
        caseId: 'test-case-123',
        patient: {
          connect: { id: patient.id }
        },
        patientName: `${patient.firstName} ${patient.lastName}`,
        createdBy: {
          connect: { id: adminUser.id }
        },
        recipients: {
          create: {
            userId: recipientUser.id,
            deliveryMethod: 'IN_APP',
            deliveryStatus: 'PENDING'
          }
        }
      },
      include: {
        recipients: true
      }
    });
    
    console.log('✅ Test notification created successfully');
    console.log(`   ID: ${notification.id}`);
    console.log(`   Title: ${notification.title}`);
    console.log(`   Recipients: ${notification.recipients.length}`);
    
  } catch (error) {
    console.error('❌ Error creating test notification:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestNotification();
