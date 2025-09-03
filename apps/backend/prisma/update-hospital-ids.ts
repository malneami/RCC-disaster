import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function updateHospitalIds() {
  console.log('🔄 Starting hospital ID update...');

  try {
    // Get all hospitals with their current IDs
    const hospitals = await prisma.hospital.findMany({
      select: {
        id: true,
        name: true,
      },
    });

    console.log(`Found ${hospitals.length} hospitals to update`);

    // Create a mapping of old IDs to new UUIDs
    const idMapping: Record<string, string> = {};
    
    for (const hospital of hospitals) {
      const newId = uuidv4();
      idMapping[hospital.id] = newId;
      console.log(`Mapping ${hospital.id} (${hospital.name}) -> ${newId}`);
    }

    // Update each hospital with a new UUID
    for (const [oldId, newId] of Object.entries(idMapping)) {
      await prisma.hospital.update({
        where: { id: oldId },
        data: { id: newId },
      });
      console.log(`✅ Updated hospital ${oldId} to ${newId}`);
    }

    // Update related records
    console.log('🔄 Updating related records...');

    // Update users
    const userUpdates = await prisma.user.updateMany({
      where: {
        hospitalId: {
          in: Object.keys(idMapping),
        },
      },
      data: {
        hospitalId: {
          set: undefined, // We'll update this in a separate step
        },
      },
    });
    console.log(`Updated ${userUpdates.count} users`);

    // Update tickets
    const ticketUpdates = await prisma.ticket.updateMany({
      where: {
        OR: [
          {
            originHospitalId: {
              in: Object.keys(idMapping),
            },
          },
          {
            destinationHospitalId: {
              in: Object.keys(idMapping),
            },
          },
        ],
      },
      data: {
        originHospitalId: {
          set: undefined,
        },
        destinationHospitalId: {
          set: undefined,
        },
      },
    });
    console.log(`Updated ${ticketUpdates.count} tickets`);

    // Update critical cases
    const criticalCaseUpdates = await prisma.criticalCase.updateMany({
      where: {
        hospitalId: {
          in: Object.keys(idMapping),
        },
      },
      data: {
        hospitalId: {
          set: undefined,
        },
      },
    });
    console.log(`Updated ${criticalCaseUpdates.count} critical cases`);

    // Update hospital tickets
    const hospitalTicketUpdates = await prisma.hospitalTicket.updateMany({
      where: {
        hospitalId: {
          in: Object.keys(idMapping),
        },
      },
      data: {
        hospitalId: {
          set: undefined,
        },
      },
    });
    console.log(`Updated ${hospitalTicketUpdates.count} hospital tickets`);

    // Now update the foreign key references with the new UUIDs
    console.log('🔄 Updating foreign key references...');

    // Update users with new hospital IDs
    for (const [oldId, newId] of Object.entries(idMapping)) {
      await prisma.user.updateMany({
        where: {
          hospitalId: undefined,
        },
        data: {
          hospitalId: newId,
        },
      });
    }

    // Update tickets with new hospital IDs
    for (const [oldId, newId] of Object.entries(idMapping)) {
      await prisma.ticket.updateMany({
        where: {
          OR: [
            { originHospitalId: undefined },
            { destinationHospitalId: undefined },
          ],
        },
        data: {
          originHospitalId: newId,
          destinationHospitalId: newId,
        },
      });
    }

    // Update critical cases with new hospital IDs
    for (const [oldId, newId] of Object.entries(idMapping)) {
      await prisma.criticalCase.updateMany({
        where: {
          hospitalId: undefined,
        },
        data: {
          hospitalId: newId,
        },
      });
    }

    // Update hospital tickets with new hospital IDs
    for (const [oldId, newId] of Object.entries(idMapping)) {
      await prisma.hospitalTicket.updateMany({
        where: {
          hospitalId: undefined,
        },
        data: {
          hospitalId: newId,
        },
      });
    }

    console.log('✅ Hospital ID update completed successfully!');
    console.log('📋 ID Mapping:');
    for (const [oldId, newId] of Object.entries(idMapping)) {
      const hospital = hospitals.find(h => h.id === oldId);
      console.log(`  ${oldId} -> ${newId} (${hospital?.name})`);
    }

  } catch (error) {
    console.error('❌ Error updating hospital IDs:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the update
updateHospitalIds()
  .then(() => {
    console.log('🎉 Hospital ID update completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Hospital ID update failed:', error);
    process.exit(1);
  });
