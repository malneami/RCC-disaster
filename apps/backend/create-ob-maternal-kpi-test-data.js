/**
 * OB Maternal KPI Test Data Script
 * Creates PregnancyKpiDailyAggregate records to test the Pregnancy KPI Dashboard.
 *
 * Run: node apps/backend/create-ob-maternal-kpi-test-data.js
 * Or:  cd apps/backend && npm run db:seed:ob-kpi
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const REGIONS = ['Riyadh', 'Makkah', 'Eastern Province', 'Madinah', 'Qassim'];

// Rates/percentages are stored as 0-1 decimals (e.g. 0.05 = 5%)
function randomRate(min = 0, max = 0.2) {
  return Math.round((min + Math.random() * (max - min)) * 1000) / 1000;
}

function randomInt(min, max) {
  return Math.floor(min + Math.random() * (max - min + 1));
}

function randomMinutes(min, max) {
  return Math.round((min + Math.random() * (max - min)) * 10) / 10;
}

function formatDate(d) {
  return d.toISOString().split('T')[0];
}

async function createObMaternalKpiTestData() {
  console.log('🚀 Creating OB Maternal KPI test data...');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Generate data for last 45 days across all regions
  for (let d = 45; d >= 0; d--) {
    const date = new Date(today);
    date.setDate(date.getDate() - d);
    const dateStr = formatDate(date);

    for (const region of REGIONS) {
      const totalCases = randomInt(2, 18);
      const maternalRed = randomInt(0, Math.min(4, totalCases));
      const maternalOrange = randomInt(0, Math.min(6, totalCases - maternalRed));

      const record = {
        date: dateStr,
        region,
        totalCases,
        maternalRedCount: maternalRed,
        maternalOrangeCount: maternalOrange,
        avgActivationToOb: randomMinutes(8, 35),
        avgActivationToDispatch: randomMinutes(12, 45),
        avgDispatchToArrival: randomMinutes(18, 55),
        maternalMortalityRate: randomRate(0, 0.03),
        severeMorbidityRate: randomRate(0.02, 0.08),
        perinatalMortalityRate: randomRate(0.01, 0.05),
        nicuRate: randomRate(0.08, 0.25),
        vaginalPercentage: randomRate(0.55, 0.75),
        cesareanPercentage: randomRate(0.22, 0.40),
        emergencyCsPercentage: randomRate(0.05, 0.18),
        planChangePercentage: randomRate(0.03, 0.12),
        documentationCompletenessAvg: randomRate(0.75, 0.98),
      };

      try {
        await prisma.pregnancyKpiDailyAggregate.upsert({
          where: {
            date_region: { date: new Date(dateStr), region },
          },
          create: {
            date: new Date(dateStr),
            region: record.region,
            totalCases: record.totalCases,
            maternalRedCount: record.maternalRedCount,
            maternalOrangeCount: record.maternalOrangeCount,
            avgActivationToOb: record.avgActivationToOb,
            avgActivationToDispatch: record.avgActivationToDispatch,
            avgDispatchToArrival: record.avgDispatchToArrival,
            maternalMortalityRate: record.maternalMortalityRate,
            severeMorbidityRate: record.severeMorbidityRate,
            perinatalMortalityRate: record.perinatalMortalityRate,
            nicuRate: record.nicuRate,
            vaginalPercentage: record.vaginalPercentage,
            cesareanPercentage: record.cesareanPercentage,
            emergencyCsPercentage: record.emergencyCsPercentage,
            planChangePercentage: record.planChangePercentage,
            documentationCompletenessAvg: record.documentationCompletenessAvg,
          },
          update: {
            totalCases: record.totalCases,
            maternalRedCount: record.maternalRedCount,
            maternalOrangeCount: record.maternalOrangeCount,
            avgActivationToOb: record.avgActivationToOb,
            avgActivationToDispatch: record.avgActivationToDispatch,
            avgDispatchToArrival: record.avgDispatchToArrival,
            maternalMortalityRate: record.maternalMortalityRate,
            severeMorbidityRate: record.severeMorbidityRate,
            perinatalMortalityRate: record.perinatalMortalityRate,
            nicuRate: record.nicuRate,
            vaginalPercentage: record.vaginalPercentage,
            cesareanPercentage: record.cesareanPercentage,
            emergencyCsPercentage: record.emergencyCsPercentage,
            planChangePercentage: record.planChangePercentage,
            documentationCompletenessAvg: record.documentationCompletenessAvg,
          },
        });
      } catch (err) {
        console.error(`Error upserting ${dateStr} / ${region}:`, err.message);
      }
    }
  }

  const total = await prisma.pregnancyKpiDailyAggregate.count();
  console.log(`✅ OB Maternal KPI test data created.`);
  console.log(`📊 Total PregnancyKpiDailyAggregate records: ${total}`);
  console.log(`   Regions: ${REGIONS.join(', ')}`);
  console.log(`   Date range: last 46 days`);
  console.log('');
  console.log('🔗 Test the Pregnancy KPI Dashboard at: OB Maternal Portal → KPI Dashboard tab');
}

createObMaternalKpiTestData()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Script failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
