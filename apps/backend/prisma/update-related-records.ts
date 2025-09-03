import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Hospital ID mapping from old string IDs to new UUIDs
const HOSPITAL_ID_MAPPING: Record<string, string> = {
  '1': '550e8400-e29b-41d4-a716-446655440001', // JGH
  '2': '550e8400-e29b-41d4-a716-446655440002', // KFCH
  '3': '550e8400-e29b-41d4-a716-446655440003', // PMNH
  '4': '550e8400-e29b-41d4-a716-446655440004', // SAMTAH
  '5': '550e8400-e29b-41d4-a716-446655440005', // ABU_ARISH
  '6': '550e8400-e29b-41d4-a716-446655440006', // SABYA
  '7': '550e8400-e29b-41d4-a716-446655440007', // BAYSH
  '8': '550e8400-e29b-41d4-a716-446655440008', // AL_HURRATH
  '9': '550e8400-e29b-41d4-a716-446655440009', // AL_DAYER
  '10': '550e8400-e29b-41d4-a716-446655440010', // JAZAN_SPECIALIZED
  '11': '550e8400-e29b-41d4-a716-446655440011', // AL_ARDHAH
  '12': '550e8400-e29b-41d4-a716-446655440012', // AL_REITH
  '13': '550e8400-e29b-41d4-a716-446655440013', // AL_IDABI
  '14': '550e8400-e29b-41d4-a716-446655440014', // AL_AYDABI
  '15': '550e8400-e29b-41d4-a716-446655440015', // AL_RAITH
  '16': '550e8400-e29b-41d4-a716-446655440016', // AL_DAIR
  '17': '550e8400-e29b-41d4-a716-446655440017', // AL_HURRAH
  '18': '550e8400-e29b-41d4-a716-446655440018', // AL_ARDHA
  '19': '550e8400-e29b-41d4-a716-446655440019', // AL_DAYR
  '20': '550e8400-e29b-41d4-a716-446655440020', // AL_HURRA
  '21': '550e8400-e29b-41d4-a716-446655440021', // AL_ARDH
  '23': '550e8400-e29b-41d4-a716-446655440023', // AL_REITH_SPECIALIZED
  '24': '550e8400-e29b-41d4-a716-446655440024', // AL_DAYER_SPECIALIZED
  '25': '550e8400-e29b-41d4-a716-446655440025', // JAZAN_CITY
  '26': '550e8400-e29b-41d4-a716-446655440026', // AL_ARDHAH_SPECIALIZED
};

async function updateRelatedRecords() {
  console.log('🔄 Starting to update related records with new hospital UUIDs...');

  try {
    // Update users
    console.log('👥 Updating users...');
    for (const [oldId, newId] of Object.entries(HOSPITAL_ID_MAPPING)) {
      const updatedUsers = await prisma.user.updateMany({
        where: { hospitalId: oldId },
        data: { hospitalId: newId },
      });
      if (updatedUsers.count > 0) {
        console.log(`  Updated ${updatedUsers.count} users for hospital ${oldId} -> ${newId}`);
      }
    }

    // Update tickets
    console.log('🎫 Updating tickets...');
    for (const [oldId, newId] of Object.entries(HOSPITAL_ID_MAPPING)) {
      const updatedTickets = await prisma.ticket.updateMany({
        where: {
          OR: [
            { originHospitalId: oldId },
            { destinationHospitalId: oldId },
          ],
        },
        data: {
          originHospitalId: newId,
          destinationHospitalId: newId,
        },
      });
      if (updatedTickets.count > 0) {
        console.log(`  Updated ${updatedTickets.count} tickets for hospital ${oldId} -> ${newId}`);
      }
    }

    // Update critical cases
    console.log('🚨 Updating critical cases...');
    for (const [oldId, newId] of Object.entries(HOSPITAL_ID_MAPPING)) {
      const updatedCriticalCases = await prisma.criticalCase.updateMany({
        where: { hospitalId: oldId },
        data: { hospitalId: newId },
      });
      if (updatedCriticalCases.count > 0) {
        console.log(`  Updated ${updatedCriticalCases.count} critical cases for hospital ${oldId} -> ${newId}`);
      }
    }

    // Update hospital tickets
    console.log('🏥 Updating hospital tickets...');
    for (const [oldId, newId] of Object.entries(HOSPITAL_ID_MAPPING)) {
      const updatedHospitalTickets = await prisma.hospitalTicket.updateMany({
        where: { hospitalId: oldId },
        data: { hospitalId: newId },
      });
      if (updatedHospitalTickets.count > 0) {
        console.log(`  Updated ${updatedHospitalTickets.count} hospital tickets for hospital ${oldId} -> ${newId}`);
      }
    }

    console.log('✅ All related records updated successfully!');

    // Verify the updates
    console.log('🔍 Verifying updates...');
    
    const totalUsers = await prisma.user.count({
      where: {
        hospitalId: {
          in: Object.values(HOSPITAL_ID_MAPPING),
        },
      },
    });
    console.log(`  Total users with new hospital IDs: ${totalUsers}`);

    const totalTickets = await prisma.ticket.count({
      where: {
        OR: [
          {
            originHospitalId: {
              in: Object.values(HOSPITAL_ID_MAPPING),
            },
          },
          {
            destinationHospitalId: {
              in: Object.values(HOSPITAL_ID_MAPPING),
            },
          },
        ],
      },
    });
    console.log(`  Total tickets with new hospital IDs: ${totalTickets}`);

    const totalCriticalCases = await prisma.criticalCase.count({
      where: {
        hospitalId: {
          in: Object.values(HOSPITAL_ID_MAPPING),
        },
      },
    });
    console.log(`  Total critical cases with new hospital IDs: ${totalCriticalCases}`);

    const totalHospitalTickets = await prisma.hospitalTicket.count({
      where: {
        hospitalId: {
          in: Object.values(HOSPITAL_ID_MAPPING),
        },
      },
    });
    console.log(`  Total hospital tickets with new hospital IDs: ${totalHospitalTickets}`);

  } catch (error) {
    console.error('❌ Error updating related records:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the update
updateRelatedRecords()
  .then(() => {
    console.log('🎉 Related records update completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Related records update failed:', error);
    process.exit(1);
  });
