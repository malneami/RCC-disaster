const { PrismaClient } = require('@prisma/client');

async function testKPICalculator() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🧪 Testing KPI Calculator Service directly...');
    
    // Create a test stroke case object
    const now = new Date();
    const registrationTime = new Date(now.getTime() - 30 * 60 * 1000); // 30 minutes ago
    const ctReportTime = new Date(now.getTime() - 20 * 60 * 1000); // 20 minutes ago
    const thrombolysisOrderTime = new Date(now.getTime() - 15 * 60 * 1000); // 15 minutes ago
    
    const testStrokeCase = {
      dateOfAdmission: registrationTime,
      timeOfCtReportFinal: ctReportTime,
      thrombolysisOrderTime: thrombolysisOrderTime,
    };
    
    console.log('📊 Test data:');
    console.log('  - Registration:', testStrokeCase.dateOfAdmission);
    console.log('  - CT Report Final:', testStrokeCase.timeOfCtReportFinal);
    console.log('  - Thrombolysis Order:', testStrokeCase.thrombolysisOrderTime);
    
    // Manual calculations
    const manualDoorToCtReport = Math.round((ctReportTime.getTime() - registrationTime.getTime()) / (1000 * 60));
    const manualDoorToThrombolysisOrder = Math.round((thrombolysisOrderTime.getTime() - registrationTime.getTime()) / (1000 * 60));
    
    console.log('🧮 Manual calculations:');
    console.log('  - Door to CT Report:', manualDoorToCtReport, 'minutes');
    console.log('  - Door to Thrombolysis Order:', manualDoorToThrombolysisOrder, 'minutes');
    
    // Test the actual KPI calculator service
    const { StrokeKPICalculatorService } = require('./dist/src/modules/stroke-cases/services/stroke-kpi-calculator.service');
    const kpiService = new StrokeKPICalculatorService();
    
    const calculations = kpiService.calculateKPIs(testStrokeCase);
    
    console.log('📈 KPI Service calculations:');
    console.log('  - Door to CT Report Minutes:', calculations.doorToCtReportMinutes);
    console.log('  - Door to Thrombolysis Order Minutes:', calculations.doorToThrombolysisOrderMinutes);
    
  } catch (error) {
    console.error('❌ Error testing KPI calculator:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testKPICalculator();
