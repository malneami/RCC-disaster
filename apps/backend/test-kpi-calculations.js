const { PrismaClient } = require('@prisma/client');

async function testKPICalculations() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Testing KPI calculations...');
    
    // Get a stroke case with timing data
    const strokeCase = await prisma.strokeCase.findFirst({
      where: {
        dateOfAdmission: { not: null },
        timeOfCtReportFinal: { not: null },
        thrombolysisOrderTime: { not: null }
      },
      select: {
        id: true,
        dateOfAdmission: true,
        timeOfCtReportFinal: true,
        thrombolysisOrderTime: true,
        doorToCtReportMinutes: true,
        doorToThrombolysisOrderMinutes: true
      }
    });
    
    if (!strokeCase) {
      console.log('❌ No stroke case found with required timing data');
      
      // Let's check what data we have
      const allCases = await prisma.strokeCase.findMany({
        select: {
          id: true,
          dateOfAdmission: true,
          timeOfCtReportFinal: true,
          thrombolysisOrderTime: true,
          doorToCtReportMinutes: true,
          doorToThrombolysisOrderMinutes: true
        },
        take: 5
      });
      
      console.log('📊 Sample stroke cases:');
      allCases.forEach((case_, index) => {
        console.log(`Case ${index + 1}:`, {
          id: case_.id,
          hasRegistration: !!case_.dateOfAdmission,
          hasCtReport: !!case_.timeOfCtReportFinal,
          hasThrombolysisOrder: !!case_.thrombolysisOrderTime,
          doorToCtReportMinutes: case_.doorToCtReportMinutes,
          doorToThrombolysisOrderMinutes: case_.doorToThrombolysisOrderMinutes
        });
      });
      
      return;
    }
    
    console.log('✅ Found stroke case with timing data:', {
      id: strokeCase.id,
      dateOfAdmission: strokeCase.dateOfAdmission,
      timeOfCtReportFinal: strokeCase.timeOfCtReportFinal,
      thrombolysisOrderTime: strokeCase.thrombolysisOrderTime,
      doorToCtReportMinutes: strokeCase.doorToCtReportMinutes,
      doorToThrombolysisOrderMinutes: strokeCase.doorToThrombolysisOrderMinutes
    });
    
    // Test manual calculation
    if (strokeCase.dateOfAdmission && strokeCase.timeOfCtReportFinal) {
      const registrationTime = new Date(strokeCase.dateOfAdmission);
      const ctReportTime = new Date(strokeCase.timeOfCtReportFinal);
      const manualDoorToCtReport = Math.round((ctReportTime.getTime() - registrationTime.getTime()) / (1000 * 60));
      
      console.log('🧮 Manual calculation - Door to CT Report:', manualDoorToCtReport, 'minutes');
    }
    
    if (strokeCase.dateOfAdmission && strokeCase.thrombolysisOrderTime) {
      const registrationTime = new Date(strokeCase.dateOfAdmission);
      const thrombolysisOrderTime = new Date(strokeCase.thrombolysisOrderTime);
      const manualDoorToThrombolysisOrder = Math.round((thrombolysisOrderTime.getTime() - registrationTime.getTime()) / (1000 * 60));
      
      console.log('🧮 Manual calculation - Door to Thrombolysis Order:', manualDoorToThrombolysisOrder, 'minutes');
    }
    
  } catch (error) {
    console.error('❌ Error testing KPI calculations:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testKPICalculations();
