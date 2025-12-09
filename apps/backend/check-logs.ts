import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const logs = await prisma.ambulanceZoneLog.findMany({
    include: {
      ambulance: true,
      hospital: true
    },
    orderBy: { entryTime: 'desc' }
  });

  console.log(`Found ${logs.length} zone logs.`);
  logs.forEach(log => {
    console.log(`[${log.entryTime.toISOString()}] Ambulance ${log.ambulance.callSign} entered ${log.hospital.name} (${log.zoneType})`);
    if (log.exitTime) {
      console.log(`  -> Exited at ${log.exitTime.toISOString()} (Duration: ${log.durationMinutes} min)`);
    }
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
