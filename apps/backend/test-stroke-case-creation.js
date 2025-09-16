const { PrismaClient } = require('@prisma/client');

async function testStrokeCaseCreation() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🧪 Testing stroke case creation with timing fields...');
    
    // Get a hospital and user for testing
    const hospital = await prisma.hospital.findFirst();
    const user = await prisma.user.findFirst();
    
    if (!hospital || !user) {
      console.log('❌ No hospital or user found for testing');
      return;
    }
    
    // Create a test patient
    const patient = await prisma.patient.create({
      data: {
        firstName: 'Test',
        lastName: 'Patient',
        nationalId: `TEST${Date.now()}`,
        age: 65,
        gender: 'MALE',
        createdById: user.id
      }
    });
    
    console.log('✅ Created test patient:', patient.id);
    
    // Create a stroke case with timing data
    const now = new Date();
    const registrationTime = new Date(now.getTime() - 30 * 60 * 1000); // 30 minutes ago
    const ctReportTime = new Date(now.getTime() - 20 * 60 * 1000); // 20 minutes ago
    const thrombolysisOrderTime = new Date(now.getTime() - 15 * 60 * 1000); // 15 minutes ago
    
    const strokeCase = await prisma.strokeCase.create({
      data: {
        patientId: patient.id,
        originHospitalId: hospital.id,
        strokeType: 'ISCHEMIC',
        currentStatus: 'CONFIRMED',
        
        // Timing fields
        timeOfRegistration: registrationTime,
        timeOfCtReportFinal: ctReportTime,
        thrombolysisOrderTime: thrombolysisOrderTime,
        
        // Other required fields
        createdById: user.id,
      }
    });
    
    console.log('✅ Created stroke case:', strokeCase.id);
    console.log('📊 Timing data:');
    console.log('  - Registration:', strokeCase.timeOfRegistration);
    console.log('  - CT Report Final:', strokeCase.timeOfCtReportFinal);
    console.log('  - Thrombolysis Order:', strokeCase.thrombolysisOrderTime);
    
    // Check if KPI calculations were performed
    console.log('📈 KPI Calculations:');
    console.log('  - Door to CT Report Minutes:', strokeCase.doorToCtReportMinutes);
    console.log('  - Door to Thrombolysis Order Minutes:', strokeCase.doorToThrombolysisOrderMinutes);
    
    // Manual calculation verification
    if (strokeCase.timeOfRegistration && strokeCase.timeOfCtReportFinal) {
      const manualDoorToCtReport = Math.round((strokeCase.timeOfCtReportFinal.getTime() - strokeCase.timeOfRegistration.getTime()) / (1000 * 60));
      console.log('  - Manual Door to CT Report calculation:', manualDoorToCtReport, 'minutes');
    }
    
    if (strokeCase.timeOfRegistration && strokeCase.thrombolysisOrderTime) {
      const manualDoorToThrombolysisOrder = Math.round((strokeCase.thrombolysisOrderTime.getTime() - strokeCase.timeOfRegistration.getTime()) / (1000 * 60));
      console.log('  - Manual Door to Thrombolysis Order calculation:', manualDoorToThrombolysisOrder, 'minutes');
    }
    
    // Clean up test data
    await prisma.strokeCase.delete({ where: { id: strokeCase.id } });
    await prisma.patient.delete({ where: { id: patient.id } });
    
    console.log('🧹 Cleaned up test data');
    console.log('✅ Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error testing stroke case creation:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testStrokeCaseCreation();
