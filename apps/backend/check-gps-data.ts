import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkGPSData() {
  console.log('=== Checking GPS Data ===\n');

  // Find ambulances with call signs containing 6185 or 4914
  const ambulances = await prisma.ambulance.findMany({
    where: {
      OR: [
        { callSign: { contains: '6185' } },
        { callSign: { contains: '4914' } },
      ],
      deletedAt: null,
    },
    select: {
      id: true,
      callSign: true,
      vehicleImei: true,
      currentLocationLat: true,
      currentLocationLng: true,
      lastUpdated: true,
      status: true,
    },
  });

  console.log(`Found ${ambulances.length} ambulances:\n`);
  ambulances.forEach(amb => {
    console.log(`Ambulance: ${amb.callSign} (${amb.id})`);
    console.log(`  IMEI: ${amb.vehicleImei}`);
    console.log(`  Status: ${amb.status}`);
    console.log(`  Current Location: (${amb.currentLocationLat}, ${amb.currentLocationLng})`);
    console.log(`  Last Updated: ${amb.lastUpdated}`);
    console.log('');
  });

  // Check recent GPS tracking logs for these ambulances
  console.log('\n=== Recent GPS Tracking Logs (last 10 entries) ===\n');
  
  for (const amb of ambulances) {
    const logs = await prisma.gPSTrackingLog.findMany({
      where: {
        ambulanceId: amb.id,
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: 10,
    });

    console.log(`\n${amb.callSign} - ${logs.length} recent logs:`);
    logs.forEach((log, index) => {
      console.log(`  ${index + 1}. [${log.timestamp.toISOString()}] (${log.latitude}, ${log.longitude}) Speed: ${log.speed || 'N/A'}`);
    });

    // Check if there are any logs in the last 5 minutes
    const recentLogs = await prisma.gPSTrackingLog.count({
      where: {
        ambulanceId: amb.id,
        timestamp: {
          gte: new Date(Date.now() - 5 * 60 * 1000),
        },
      },
    });
    console.log(`  Logs in last 5 minutes: ${recentLogs}`);
  }

  await prisma.$disconnect();
}

checkGPSData().catch(console.error);
