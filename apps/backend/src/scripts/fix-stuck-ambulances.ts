import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Fixing Stuck Ambulances...\n');

  // Find all ambulances with IN_USE status
  const inUseAmbulances = await prisma.ambulance.findMany({
    where: {
      status: 'IN_USE',
      isActive: true,
      deletedAt: null
    },
    include: {
      assignments: {
        where: {
          deletedAt: null
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 1,
        include: {
          ticket: {
            select: {
              id: true,
              ticketNumber: true,
              status: true,
              emsAssignmentStatus: true
            }
          }
        }
      }
    }
  });

  console.log(`Found ${inUseAmbulances.length} ambulances with IN_USE status\n`);

  let fixedCount = 0;
  let syncedCount = 0;

  for (const ambulance of inUseAmbulances) {
    const latestAssignment = ambulance.assignments[0];

    if (!latestAssignment) {
      // No assignment at all - should be AVAILABLE
      console.log(`⚠️  Ambulance ${ambulance.callSign} - No assignments, setting to AVAILABLE`);
      await prisma.ambulance.update({
        where: { id: ambulance.id },
        data: { status: 'AVAILABLE' }
      });
      fixedCount++;
      continue;
    }

    const assignmentStatus = latestAssignment.status;
    const ticketEmsStatus = latestAssignment.ticket.emsAssignmentStatus;

    console.log(`🚑 Ambulance ${ambulance.callSign}:`);
    console.log(`   Latest Assignment: ${latestAssignment.id}`);
    console.log(`   Assignment Status: ${assignmentStatus}`);
    console.log(`   Ticket EMS Status: ${ticketEmsStatus || 'NULL'}`);
    console.log(`   Ticket: ${latestAssignment.ticket.ticketNumber}`);

    let needsFix = false;
    let needsSync = false;

    // Check if assignment is in terminal state
    if (assignmentStatus === 'ARRIVED' || assignmentStatus === 'CANCELLED') {
      console.log(`   ✅ Assignment is in terminal state (${assignmentStatus})`);
      console.log(`   🔄 Setting ambulance to AVAILABLE`);
      
      await prisma.ambulance.update({
        where: { id: ambulance.id },
        data: { status: 'AVAILABLE' }
      });
      
      needsFix = true;
      fixedCount++;
    }

    // Check if ticket EMS status needs sync
    if (ticketEmsStatus !== assignmentStatus) {
      console.log(`   ⚠️  Ticket EMS status mismatch! Syncing from ${ticketEmsStatus} to ${assignmentStatus}`);
      
      await prisma.ticket.update({
        where: { id: latestAssignment.ticket.id },
        data: { 
          emsAssignmentStatus: assignmentStatus,
          emsStatusUpdatedAt: new Date()
          // emsStatusUpdatedBy removed - requires valid user FK
        }
      });
      
      needsSync = true;
      syncedCount++;
    }

    if (!needsFix && !needsSync) {
      console.log(`   ✅ No issues found - ambulance correctly IN_USE`);
    }

    console.log('');
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ Fixed ${fixedCount} ambulance(s)`);
  console.log(`🔄 Synced ${syncedCount} ticket(s)`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error('❌ Error:', error);
  prisma.$disconnect();
  process.exit(1);
});
