/**
 * Test script to verify access logs are being created
 * Run with: node apps/backend/scripts/test-access-logs.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testAccessLogs() {
  try {
    console.log('🔍 Checking access logs...\n');

    // Check patient access logs
    const patientLogs = await prisma.patientAccessLog.findMany({
      take: 10,
      orderBy: { timestamp: 'desc' },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        patient: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    console.log(`📊 Patient Access Logs: ${patientLogs.length} recent entries`);
    patientLogs.forEach((log, index) => {
      console.log(`  ${index + 1}. ${log.accessType} - Patient: ${log.patient?.firstName} ${log.patient?.lastName} - User: ${log.user?.firstName} ${log.user?.lastName} - ${log.timestamp}`);
    });

    // Check ticket access logs
    const ticketLogs = await prisma.ticketAccessLog.findMany({
      take: 10,
      orderBy: { timestamp: 'desc' },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    console.log(`\n📊 Ticket Access Logs: ${ticketLogs.length} recent entries`);
    ticketLogs.forEach((log, index) => {
      console.log(`  ${index + 1}. ${log.accessType} - User: ${log.user?.firstName} ${log.user?.lastName} - ${log.timestamp}`);
    });

    // Check medical record access logs
    const medicalRecordLogs = await prisma.medicalRecordAccessLog.findMany({
      take: 10,
      orderBy: { timestamp: 'desc' },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    console.log(`\n📊 Medical Record Access Logs: ${medicalRecordLogs.length} recent entries`);
    medicalRecordLogs.forEach((log, index) => {
      console.log(`  ${index + 1}. ${log.accessType} - User: ${log.user?.firstName} ${log.user?.lastName} - ${log.timestamp}`);
    });

    // Summary
    const totalPatientLogs = await prisma.patientAccessLog.count();
    const totalTicketLogs = await prisma.ticketAccessLog.count();
    const totalMedicalRecordLogs = await prisma.medicalRecordAccessLog.count();

    console.log(`\n📈 Summary:`);
    console.log(`  Total Patient Access Logs: ${totalPatientLogs}`);
    console.log(`  Total Ticket Access Logs: ${totalTicketLogs}`);
    console.log(`  Total Medical Record Access Logs: ${totalMedicalRecordLogs}`);

    // Check for recent UPDATE logs
    const recentUpdates = await prisma.patientAccessLog.findMany({
      where: {
        accessType: 'UPDATE',
        timestamp: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
      orderBy: { timestamp: 'desc' },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        patient: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    console.log(`\n🔄 Recent UPDATE logs (last 24 hours): ${recentUpdates.length}`);
    recentUpdates.forEach((log, index) => {
      console.log(`  ${index + 1}. Patient: ${log.patient?.firstName} ${log.patient?.lastName} - User: ${log.user?.firstName} ${log.user?.lastName} - ${log.timestamp} - Reason: ${log.reason}`);
    });

  } catch (error) {
    console.error('❌ Error checking access logs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAccessLogs();

