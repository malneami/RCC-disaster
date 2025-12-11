import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyKPIData() {
  console.log('🔍 Verifying KPI Test Data directly from Database...\n');

  // Verify STEMI-001 (Historical)
  const stemi001 = await prisma.patient.findFirst({
    where: { mrn: 'STEMI-001' },
    include: { stemiCases: true }
  });

  if (stemi001 && stemi001.stemiCases.length > 0) {
    console.log('✅ STEMI-001 (Historical) Found:');
    console.log(`   - Time: ${stemi001.stemiCases[0].triageTime}`);
  } else {
    console.error('❌ STEMI-001 NOT FOUND');
  }

  // Verify STEMI-008 (Recent - Today)
  const stemi008 = await prisma.patient.findFirst({
    where: { mrn: 'STEMI-008' },
    include: { stemiCases: true }
  });

  if (stemi008 && stemi008.stemiCases.length > 0) {
    console.log('✅ STEMI-008 (Recent) Found:');
    console.log(`   - Time: ${stemi008.stemiCases[0].triageTime}`);
    const triage = new Date(stemi008.stemiCases[0].triageTime!);
    const now = new Date();
    const diffHours = (now.getTime() - triage.getTime()) / (1000 * 60 * 60);
    console.log(`   - Age: ${diffHours.toFixed(1)} hours ago (Expected < 24h)`);
  } else {
    console.error('❌ STEMI-008 NOT FOUND');
  }

   // Verify STROKE-008 (Recent - Today)
   const stroke008 = await prisma.patient.findFirst({
    where: { mrn: 'STROKE-008' },
    include: { strokeCases: true }
  });

  if (stroke008 && stroke008.strokeCases.length > 0) {
    console.log('✅ STROKE-008 (Recent) Found:');
    console.log(`   - Time: ${stroke008.strokeCases[0].dateOfAdmission}`);
  } else {
    console.error('❌ STROKE-008 NOT FOUND');
  }

  console.log('\nVerification Complete.');
}

verifyKPIData()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
