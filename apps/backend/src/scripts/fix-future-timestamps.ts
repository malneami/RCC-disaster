import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  
  try {
    // Current time + 1 hour buffer for clock skew/timezone differences
    const limitDate = new Date(Date.now() + 60 * 60 * 1000); 
    
    console.log(`Checking for GPS logs with timestamp after ${limitDate.toISOString()}...`);

    const futureLogs = await prisma.gPSTrackingLog.findMany({
      where: {
        timestamp: {
          gt: limitDate,
        },
      },
      select: {
        id: true,
        createdAt: true,
        timestamp: true
      }
    });

    console.log(`Found ${futureLogs.length} records with future timestamps.`);

    if (futureLogs.length === 0) {
      console.log('No records to fix.');
      return;
    }

    console.log('Fixing records (setting timestamp = createdAt)...');
    let fixedCount = 0;

    for (const log of futureLogs) {
      await prisma.gPSTrackingLog.update({
        where: { id: log.id },
        data: { timestamp: log.createdAt }
      });
      
      fixedCount++;
      if (fixedCount % 100 === 0) {
        console.log(`Fixed ${fixedCount} / ${futureLogs.length} records...`);
      }
    }

    console.log(`Successfully fixed ${fixedCount} records.`);
  } catch (error) {
    console.error('Error executing script:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
