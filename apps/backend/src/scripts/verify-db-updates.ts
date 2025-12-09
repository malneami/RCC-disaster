import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyDBUpdates() {
  console.log('🔍 Verifying Database Updates...\n');

  // 1. Check ambulances with recent updates
  const recentlyUpdated = await prisma.ambulance.findMany({
    where: {
      isActive: true,
      deletedAt: null,
      lastUpdated: {
        gte: new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes
      }
    },
    select: {
      callSign: true,
      vehicleImei: true,
      currentLocationLat: true,
      currentLocationLng: true,
      lastUpdated: true
    },
    orderBy: {
      lastUpdated: 'desc'
    },
    take: 10
  });

  console.log(`📊 Ambulances updated in last 5 minutes: ${recentlyUpdated.length}`);
  recentlyUpdated.forEach(a => {
    const age = Math.round((Date.now() - a.lastUpdated!.getTime()) / 1000);
    console.log(`   - ${a.callSign}: (${a.currentLocationLat}, ${a.currentLocationLng}) - ${age}s ago`);
  });

  // 2. Check GPS tracking logs
  const recentLogs = await prisma.gPSTrackingLog.findMany({
    where: {
      timestamp: {
        gte: new Date(Date.now() - 5 * 60 * 1000)
      }
    },
    include: {
      ambulance: {
        select: {
          callSign: true
        }
      }
    },
    orderBy: {
      timestamp: 'desc'
    },
    take: 10
  });

  console.log(`\n📍 GPS Tracking Logs in last 5 minutes: ${recentLogs.length}`);
  recentLogs.forEach(log => {
    const age = Math.round((Date.now() - log.timestamp.getTime()) / 1000);
    console.log(`   - ${log.ambulance.callSign}: (${log.latitude}, ${log.longitude}) - ${age}s ago`);
  });

  // 3. Summary
  console.log('\n📈 Summary:');
  if (recentlyUpdated.length > 0) {
    console.log('   ✅ Database is being updated with fresh data');
  } else {
    console.log('   ❌ No recent updates found in database');
    console.log('   ⚠️  The monitoring script may not be writing to the DB');
  }

  await prisma.$disconnect();
}

verifyDBUpdates();
