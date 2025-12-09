import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listAmbulances() {
  const ambulances = await prisma.ambulance.findMany({
    where: {
      isActive: true,
      deletedAt: null
    },
    select: {
      id: true,
      callSign: true,
      vehicleImei: true,
      updatedAt: true,
      gpsTrackingLogs: {
        take: 1,
        orderBy: {
          timestamp: 'desc'
        }
      }
    }
  });

  console.log(`Found ${ambulances.length} active ambulances:`);
  ambulances.forEach(a => {
    const lastLog = a.gpsTrackingLogs[0];
    console.log(`- ${a.callSign} (IMEI: ${a.vehicleImei})`);
    if (lastLog) {
      console.log(`  Last Loc: ${lastLog.latitude}, ${lastLog.longitude} @ ${lastLog.timestamp}`);
    } else {
      console.log(`  Last Loc: N/A`);
    }
    console.log(`  Last Update: ${a.updatedAt}`);
  });
}

listAmbulances()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
