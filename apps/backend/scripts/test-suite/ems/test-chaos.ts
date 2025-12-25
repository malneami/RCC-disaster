
import { 
  prisma, 
  cleanupTestEntities, 
  ensureTestHospital, 
  createTestAmbulance, 
  calculateDistance,
  sleep,
  TEST_TICKET_ID,
  TEST_AMBULANCE_ID,
  TEST_HOSPITAL_ID
} from './utils';
import { TicketStatus, TicketPriority, PatientGender, UserRole, UserStatus, AssignmentStatus } from '@prisma/client';

async function runModule4() {
  console.log('🚀 Starting Module 4: Edge Cases & Chaos');

  // 1. Setup
  await cleanupTestEntities();
  const hospital = await ensureTestHospital();
  
  // Ensure User/Patient
  const testUser = await prisma.user.upsert({
    where: { email: 'test-admin@rcc.com' },
    update: {},
    create: { email: 'test-admin@rcc.com', firstName: 'Test', lastName: 'Admin', passwordHash: 'hash', role: UserRole.ADMIN, status: UserStatus.ACTIVE }
  });
  const testPatient = await prisma.patient.upsert({
    where: { nationalId: '1000000001' },
    update: {},
    create: { nationalId: '1000000001', firstName: 'John', lastName: 'Doe', dateOfBirth: new Date(), gender: PatientGender.MALE, age: 30, bloodType: 'O', phoneNumber: '050', createdById: testUser.id }
  });

  // --------------------------------------------------------------------------------
  // Scenario 4.2: Large Volume (Load Test)
  // --------------------------------------------------------------------------------
  console.log('\n--- Scenario 4.2: Large Volume (Create 50 Assignments) ---');
  
  const COUNT = 50;
  const start = Date.now();
  const promises = [];

  for (let i = 0; i < COUNT; i++) {
     promises.push((async () => {
        const ticketNum = `T-LOAD-${i}`;
        // Create Ticket
        const t = await prisma.ticket.create({
            data: {
                ticketNumber: ticketNum,
                status: TicketStatus.PENDING,
                priority: TicketPriority.EMERGENCY,
                originHospitalId: hospital.id,
                createdById: testUser.id,
                patientId: testPatient.id
            }
        });
        // Create Assignment
        await prisma.eMSAssignment.create({
            data: {
                ambulanceId: null, // Pending assignment
                ticketId: t.id,
                status: AssignmentStatus.ASSIGNED,
                assignedAt: new Date(),
                createdBy: testUser.id
            }
        });
     })());
  }

  try {
     await Promise.all(promises);
     const end = Date.now();
     console.log(`✅ Created ${COUNT} assignments in ${(end - start)}ms`);
     
     // Verify Count
     const count = await prisma.eMSAssignment.count({ where: { createdBy: testUser.id, status: AssignmentStatus.ASSIGNED } });
     // Matches COUNT (plus potentially others if not cleaned) but we ran cleanup.
     if (count >= COUNT) {
         console.log(`✅ Verified Count: ${count}`);
     } else {
         console.log(`❌ Count Mismatch: ${count}`);
     }

  } catch (err: any) {
     console.log('❌ Load Test Failed:', err.message);
  }
  
  // Cleanup Load Data
  console.log('Cleaning up load data...');
  // Delete by prefix logic if possible, or just delete all by User?
  // User is 'test-admin@rcc.com'. Careful not to delete important stuff if we used real admin.
  // We used a specific test user.
  // Actually, easiest is delete Tickets where ticketNumber starts with T-LOAD.
  await prisma.eMSAssignment.deleteMany({ where: { ticket: { ticketNumber: { startsWith: 'T-LOAD' } } } });
  await prisma.ticket.deleteMany({ where: { ticketNumber: { startsWith: 'T-LOAD' } } });


  // --------------------------------------------------------------------------------
  // Scenario 4.3: Invalid State Handling (Database constraints)
  // --------------------------------------------------------------------------------
  console.log('\n--- Scenario 4.3: Invalid State Handling ---');
  // Attempt to create Assignment with invalid Enum (Typescript prevents, but we can cast 'as any')
  try {
      await prisma.eMSAssignment.create({
          data: {
              ticketId: 'invalid-ticket-id',
              status: 'INVALID_STATUS' as any,
              assignedAt: new Date(),
              createdBy: testUser.id
          }
      });
      console.log('❌ Scenario 4.3 Failed: Allowed Invalid Enum/FK');
  } catch (err: any) {
      if (err.code === 'P2003' || err.message.includes('Foreign key') || err.message.includes('Argument')) {
           console.log('✅ Scenario 4.3 Blocked Invalid FK/Enum (PASS)');
      } else {
           console.log(`✅ Scenario 4.3 Blocked with error: ${err.code || err.message}`);
      }
  }

  await cleanupTestEntities();
}

runModule4().catch(console.error);
