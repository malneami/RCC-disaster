import { PrismaClient } from '@prisma/client';
import * as readline from 'readline';

const prisma = new PrismaClient();

interface GPSLog {
  id: string;
  ambulanceId: string;
  latitude: number;
  longitude: number;
  timestamp: Date;
  createdAt: Date;
}

async function promptUser(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase());
    });
  });
}

async function main() {
  console.log('🔍 GPS Timestamp Cleanup Script');
  console.log('================================\n');

  try {
    // 1. Find future-timestamped logs
    console.log('Searching for GPS logs with future timestamps...\n');
    
    const futureLogs = await prisma.gPSTrackingLog.findMany({
      where: {
        timestamp: { gt: new Date() }
      },
      orderBy: { timestamp: 'desc' },
      select: {
        id: true,
        ambulanceId: true,
        latitude: true,
        longitude: true,
        timestamp: true,
        createdAt: true
      }
    });

    console.log(`✅ Found ${futureLogs.length} GPS logs with future timestamps\n`);

    if (futureLogs.length === 0) {
      console.log('✨ No future-timestamped GPS logs found. Database is clean!');
      await prisma.$disconnect();
      return;
    }

    // 2. Display statistics
    const ambulanceIds = new Set(futureLogs.map(log => log.ambulanceId));
    const oldestFutureTimestamp = futureLogs[futureLogs.length - 1].timestamp;
    const newestFutureTimestamp = futureLogs[0].timestamp;
    const now = new Date();

    console.log('📊 Statistics:');
    console.log(`   - Total future logs: ${futureLogs.length}`);
    console.log(`   - Affected ambulances: ${ambulanceIds.size}`);
    console.log(`   - Oldest future timestamp: ${oldestFutureTimestamp.toISOString()}`);
    console.log(`   - Newest future timestamp: ${newestFutureTimestamp.toISOString()}`);
    console.log(`   - Current time: ${now.toISOString()}\n`);

    // 3. Display sample records
    console.log('📋 Sample Records (first 5):');
    futureLogs.slice(0, 5).forEach((log, index) => {
      const futureSeconds = Math.round((log.timestamp.getTime() - now.getTime()) / 1000);
      console.log(`   ${index + 1}. Ambulance: ${log.ambulanceId}`);
      console.log(`      Timestamp: ${log.timestamp.toISOString()} (${futureSeconds}s in future)`);
      console.log(`      Created At: ${log.createdAt.toISOString()}`);
      console.log(`      Location: (${log.latitude}, ${log.longitude})\n`);
    });

    // 4. Ask user for action
    console.log('🔧 Available Actions:');
    console.log('   1. DELETE - Delete all future-timestamped logs (safest, loses data)');
    console.log('   2. ADJUST - Adjust timestamps to createdAt value (preserves location data)');
    console.log('   3. EXPORT - Export to CSV for manual review');
    console.log('   4. CANCEL - Exit without making changes\n');

    const action = await promptUser('Choose an action (1-4): ');

    switch (action) {
      case '1':
      case 'delete':
        await deleteFutureLogs(futureLogs);
        break;
      
      case '2':
      case 'adjust':
        await adjustTimestamps(futureLogs);
        break;
      
      case '3':
      case 'export':
        await exportToCSV(futureLogs);
        break;
      
      case '4':
      case 'cancel':
        console.log('❌ Operation cancelled. No changes made.');
        break;
      
      default:
        console.log('❌ Invalid option. Operation cancelled.');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function deleteFutureLogs(logs: GPSLog[]) {
  console.log(`\n⚠️  WARNING: This will permanently delete ${logs.length} GPS logs.\n`);
  const confirm = await promptUser('Type "DELETE" to confirm: ');

  if (confirm !== 'delete') {
    console.log('❌ Operation cancelled.');
    return;
  }

  console.log('\n🗑️  Deleting future-timestamped logs...');

  const logIds = logs.map(log => log.id);
  const result = await prisma.gPSTrackingLog.deleteMany({
    where: {
      id: { in: logIds }
    }
  });

  console.log(`✅ Successfully deleted ${result.count} GPS logs.`);
  console.log('📝 Recommendation: Monitor GPS API to ensure no new future timestamps are created.');
}

async function adjustTimestamps(logs: GPSLog[]) {
  console.log(`\n⚠️  WARNING: This will modify ${logs.length} GPS log timestamps.\n`);
  console.log('   Timestamps will be adjusted to their createdAt values.\n');
  
  const confirm = await promptUser('Type "ADJUST" to confirm: ');

  if (confirm !== 'adjust') {
    console.log('❌ Operation cancelled.');
    return;
  }

  console.log('\n🔧 Adjusting timestamps...');

  let updatedCount = 0;
  for (const log of logs) {
    await prisma.gPSTrackingLog.update({
      where: { id: log.id },
      data: { timestamp: log.createdAt }
    });
    updatedCount++;

    if (updatedCount % 100 === 0) {
      console.log(`   Progress: ${updatedCount}/${logs.length}`);
    }
  }

  console.log(`✅ Successfully adjusted ${updatedCount} GPS log timestamps.`);
  console.log('📝 All timestamps have been set to their createdAt values.');
}

async function exportToCSV(logs: GPSLog[]) {
  const fs = require('fs');
  const path = require('path');

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const filename = `future-gps-logs-${timestamp}.csv`;
  const filepath = path.join(process.cwd(), filename);

  console.log(`\n📤 Exporting ${logs.length} records to CSV...`);

  const csvHeader = 'ID,Ambulance ID,Latitude,Longitude,Timestamp,Created At,Future Seconds\n';
  const now = new Date();
  
  const csvRows = logs.map(log => {
    const futureSeconds = Math.round((log.timestamp.getTime() - now.getTime()) / 1000);
    return `${log.id},${log.ambulanceId},${log.latitude},${log.longitude},${log.timestamp.toISOString()},${log.createdAt.toISOString()},${futureSeconds}`;
  }).join('\n');

  fs.writeFileSync(filepath, csvHeader + csvRows);

  console.log(`✅ Successfully exported to: ${filepath}`);
  console.log('📝 You can now review the data and decide on the appropriate action.');
}

// Run the script
main()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
