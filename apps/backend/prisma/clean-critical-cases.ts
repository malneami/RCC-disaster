import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanCriticalCases() {
  console.log('🧹 Starting cleanup of STEMI, Stroke, and Trauma data...\n');

  try {
    // Step 1: Delete Stroke-related data
    console.log('📊 Cleaning Stroke data...');
    
    // Delete stroke rehabilitation records
    const strokeRehab = await prisma.strokeRehabilitation.deleteMany({});
    console.log(`  ✓ Deleted ${strokeRehab.count} stroke rehabilitation records`);
    
    // Delete stroke assessment scores
    const strokeAssessments = await prisma.strokeAssessmentScore.deleteMany({});
    console.log(`  ✓ Deleted ${strokeAssessments.count} stroke assessment scores`);
    
    // Delete stroke timeline events
    const strokeTimeline = await prisma.strokeTimeline.deleteMany({});
    console.log(`  ✓ Deleted ${strokeTimeline.count} stroke timeline events`);
    
    // Delete stroke KPI summaries
    const strokeKpiSummaries = await prisma.strokeKpiSummary.deleteMany({});
    console.log(`  ✓ Deleted ${strokeKpiSummaries.count} stroke KPI summaries`);
    
    // Get stroke case IDs before deletion
    const strokeCases = await prisma.strokeCase.findMany({
      select: { id: true, ticketId: true, patientId: true }
    });
    console.log(`  ℹ Found ${strokeCases.length} stroke cases to delete`);
    
    // Delete stroke cases
    const deletedStrokeCases = await prisma.strokeCase.deleteMany({});
    console.log(`  ✓ Deleted ${deletedStrokeCases.count} stroke cases\n`);

    // Step 2: Delete STEMI-related data
    console.log('💓 Cleaning STEMI data...');
    
    // Get STEMI case IDs before deletion
    const stemiCases = await prisma.stemiCase.findMany({
      select: { id: true, ticketId: true, patientId: true }
    });
    console.log(`  ℹ Found ${stemiCases.length} STEMI cases to delete`);
    
    // Delete STEMI cases
    const deletedStemiCases = await prisma.stemiCase.deleteMany({});
    console.log(`  ✓ Deleted ${deletedStemiCases.count} STEMI cases\n`);

    // Step 3: Delete Trauma-related data
    console.log('🚑 Cleaning Trauma data...');
    
    // Get trauma case IDs before deletion
    const traumaCases = await prisma.traumaCase.findMany({
      select: { id: true, ticketId: true, patientId: true }
    });
    console.log(`  ℹ Found ${traumaCases.length} trauma cases to delete`);
    
    // Delete trauma cases
    const deletedTraumaCases = await prisma.traumaCase.deleteMany({});
    console.log(`  ✓ Deleted ${deletedTraumaCases.count} trauma cases\n`);

    // Step 4: Delete related tickets
    console.log('🎫 Cleaning related tickets...');
    
    const deletedTickets = await prisma.ticket.deleteMany({
      where: {
        pathway: {
          in: ['STEMI', 'STROKE', 'TRAUMA']
        }
      }
    });
    console.log(`  ✓ Deleted ${deletedTickets.count} tickets\n`);

    // Step 5: Delete timeline events for stroke cases only
    console.log('⏱️  Cleaning timeline events...');
    
    const deletedTimelineEvents = await prisma.timelineEvent.deleteMany({
      where: {
        strokeCaseId: { not: null }
      }
    });
    console.log(`  ✓ Deleted ${deletedTimelineEvents.count} timeline events\n`);

    // Step 6: Delete critical case tracker entries
    console.log('📋 Cleaning critical case tracker...');
    
    const deletedCriticalCases = await prisma.criticalCase.deleteMany({
      where: {
        caseType: {
          in: ['STEMI', 'STROKE', 'TRAUMA']
        }
      }
    });
    console.log(`  ✓ Deleted ${deletedCriticalCases.count} critical case entries\n`);

    // Step 7: Collect all patient IDs from deleted cases
    const allPatientIds = new Set([
      ...strokeCases.map(c => c.patientId),
      ...stemiCases.map(c => c.patientId),
      ...traumaCases.map(c => c.patientId)
    ]);

    console.log(`📝 Found ${allPatientIds.size} unique patients associated with deleted cases`);

    // Step 8: Delete notifications for these patients
    console.log('🔔 Cleaning notifications...');
    
    const deletedNotifications = await prisma.notification.deleteMany({
      where: {
        patientId: {
          in: Array.from(allPatientIds)
        }
      }
    });
    console.log(`  ✓ Deleted ${deletedNotifications.count} notifications\n`);

    // Step 9: Delete case notes and replies
    console.log('📝 Cleaning case notes...');
    
    // First delete replies
    const caseNotes = await prisma.caseNote.findMany({
      where: {
        patientId: {
          in: Array.from(allPatientIds)
        }
      },
      select: { id: true }
    });
    
    const deletedReplies = await prisma.reply.deleteMany({
      where: {
        caseNoteId: {
          in: caseNotes.map(cn => cn.id)
        }
      }
    });
    console.log(`  ✓ Deleted ${deletedReplies.count} case note replies`);
    
    // Delete case note recipients
    const deletedCaseNoteRecipients = await prisma.caseNoteRecipient.deleteMany({
      where: {
        caseNoteId: {
          in: caseNotes.map(cn => cn.id)
        }
      }
    });
    console.log(`  ✓ Deleted ${deletedCaseNoteRecipients.count} case note recipients`);
    
    // Delete case notes
    const deletedCaseNotes = await prisma.caseNote.deleteMany({
      where: {
        patientId: {
          in: Array.from(allPatientIds)
        }
      }
    });
    console.log(`  ✓ Deleted ${deletedCaseNotes.count} case notes\n`);

    // Step 10: Delete notification recipients
    console.log('👥 Cleaning notification recipients...');
    
    const deletedNotificationRecipients = await prisma.notificationRecipient.deleteMany({
      where: {
        notification: {
          patientId: {
            in: Array.from(allPatientIds)
          }
        }
      }
    });
    console.log(`  ✓ Deleted ${deletedNotificationRecipients.count} notification recipients\n`);

    // Step 11: Check if patients have any other records before deleting
    console.log('👤 Checking patients for orphaned records...');
    
    let orphanedPatients = 0;
    for (const patientId of allPatientIds) {
      // Check if patient has any remaining medical records or other associations
      const medicalRecords = await prisma.medicalRecord.count({
        where: { patientId }
      });
      
      const accessLogs = await prisma.patientAccessLog.count({
        where: { patientId }
      });

      // Check for any remaining tickets (non-critical pathways)
      const remainingTickets = await prisma.ticket.count({
        where: { patientId }
      });

      // Only delete if truly orphaned (no other records)
      if (medicalRecords === 0 && accessLogs === 0 && remainingTickets === 0) {
        await prisma.patient.delete({
          where: { id: patientId }
        });
        orphanedPatients++;
      }
    }
    console.log(`  ✓ Deleted ${orphanedPatients} orphaned patients`);
    console.log(`  ℹ Kept ${allPatientIds.size - orphanedPatients} patients with other records\n`);

    // Summary
    console.log('✅ Cleanup completed successfully!\n');
    console.log('📊 Summary:');
    console.log(`  - Stroke cases: ${deletedStrokeCases.count}`);
    console.log(`  - STEMI cases: ${deletedStemiCases.count}`);
    console.log(`  - Trauma cases: ${deletedTraumaCases.count}`);
    console.log(`  - Tickets: ${deletedTickets.count}`);
    console.log(`  - Timeline events: ${deletedTimelineEvents.count}`);
    console.log(`  - Critical case entries: ${deletedCriticalCases.count}`);
    console.log(`  - Notifications: ${deletedNotifications.count}`);
    console.log(`  - Case notes: ${deletedCaseNotes.count}`);
    console.log(`  - Patients: ${orphanedPatients}`);
    console.log('');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
cleanCriticalCases()
  .then(() => {
    console.log('✨ All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
