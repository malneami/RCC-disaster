const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createMissingTimelineEvents() {
  try {
    console.log('🔍 Creating missing timeline events for existing stroke cases...\n');

    // Get all stroke cases without timeline events
    const strokeCases = await prisma.strokeCase.findMany({
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true,
          }
        },
        timeline: true,
        createdBy: {
          select: {
            id: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`📊 Total stroke cases: ${strokeCases.length}\n`);

    let createdCount = 0;

    for (const strokeCase of strokeCases) {
      if (strokeCase.timeline.length === 0) {
        console.log(`Creating timeline event for: ${strokeCase.patient.firstName} ${strokeCase.patient.lastName} - ${strokeCase.strokeType} (${strokeCase.id})`);
        
        try {
          await prisma.strokeTimeline.create({
            data: {
              strokeCaseId: strokeCase.id,
              ticketId: strokeCase.ticketId,
              fromStatus: null,
              toStatus: strokeCase.currentStatus,
              eventTimestamp: strokeCase.createdAt, // Use case creation time
              eventDescription: `Stroke case created - ${strokeCase.strokeType} stroke`,
              eventLocation: 'ED',
              eventType: 'ARRIVAL',
              triggeredBy: strokeCase.createdById,
              createdById: strokeCase.createdById,
            },
          });
          
          createdCount++;
          console.log(`✅ Timeline event created`);
        } catch (error) {
          console.error(`❌ Error creating timeline event:`, error.message);
        }
      } else {
        console.log(`⏭️  Skipping ${strokeCase.patient.firstName} ${strokeCase.patient.lastName} - already has ${strokeCase.timeline.length} timeline events`);
      }
    }

    console.log(`\n📋 Summary:`);
    console.log(`✅ Created ${createdCount} timeline events`);
    console.log(`⏭️  Skipped ${strokeCases.length - createdCount} cases (already had timeline events)`);

  } catch (error) {
    console.error('❌ Error creating timeline events:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createMissingTimelineEvents();
