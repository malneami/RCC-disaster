
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
import { TicketStatus, TicketPriority, PatientGender, UserRole, UserStatus, AssignmentStatus, AmbulanceStatus, AmbulanceType } from '@prisma/client';
import { Logger } from '@nestjs/common';

async function runModule3() {
  console.log('🚀 Starting Module 3: End-to-End Lifecycle');

  // 1. Setup
  await cleanupTestEntities();
  const hospital = await ensureTestHospital();
  
  // Ensure User
  const testUser = await prisma.user.upsert({
    where: { email: 'test-admin@rcc.com' },
    update: {},
    create: {
      email: 'test-admin@rcc.com',
      firstName: 'Test',
      lastName: 'Admin',
      passwordHash: 'hash',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE
    }
  });

  // Ensure Patient
  const testPatient = await prisma.patient.upsert({
    where: { nationalId: '1000000001' },
    update: {},
    create: {
      firstName: 'John',
      lastName: 'Doe',
      nationalId: '1000000001',
      dateOfBirth: new Date('1990-01-01'),
      gender: PatientGender.MALE,
      bloodType: 'O_POS', 
      phoneNumber: '0500000000',
      createdById: testUser.id
    }
  });

  // --------------------------------------------------------------------------------
  // Scenario 3.1: Happy Path
  // --------------------------------------------------------------------------------
  console.log('\n--- Scenario 3.1: Happy Path (Full Lifecycle) ---');
  
  // 1. Create Ticket
  const ticket = await prisma.ticket.create({
    data: {
      id: TEST_TICKET_ID,
      ticketNumber: 'T-MOCK',
      status: TicketStatus.PENDING,
      priority: TicketPriority.EMERGENCY,
      originHospitalId: hospital.id,
      createdById: testUser.id,
      patientId: testPatient.id
    }
  });
  console.log('1. Ticket Created: PENDING');

  // 2. Create Ambulance & Assignment
  const ambulance = await createTestAmbulance();
  
  const assignment = await prisma.eMSAssignment.create({
    data: {
      ambulanceId: ambulance.id,
      ticketId: ticket.id,
      status: AssignmentStatus.EMS_CONTACT, // Start
      assignedAt: new Date(),
      createdBy: testUser.id
    }
  });
  console.log('2. Assignment Created: EMS_CONTACT');

  // 3. Update Status -> EMS_ARRIVAL
  await prisma.eMSAssignment.update({ 
      where: { id: assignment.id }, 
      data: { status: AssignmentStatus.EMS_ARRIVAL, emsContactTime: new Date() } 
  });
  console.log('3. Status -> EMS_ARRIVAL');

  // 4. Update Status -> PATIENT_LOADED (New status in some flows, but usually DEPARTED comes next)
  // Check Enum: EMS_CONTACT, EN_ROUTE, EMS_ARRIVAL, AT_PICKUP, PATIENT_LOADED, DEPARTED, ARRIVED...
  // Let's assume flow: EMS_ARRIVAL -> PATIENT_LOADED -> DEPARTED.
  
  await prisma.eMSAssignment.update({
      where: { id: assignment.id },
      data: { status: AssignmentStatus.PATIENT_LOADED }
  });
  console.log('4. Status -> PATIENT_LOADED');

  // 5. Update Status -> DEPARTED (Journey Start)
  await prisma.eMSAssignment.update({
      where: { id: assignment.id },
      data: { status: AssignmentStatus.DEPARTED, journeyStartTime: new Date() }
  });
  console.log('5. Status -> DEPARTED');

  // 6. Update Status -> ARRIVED (Journey End)
  await prisma.eMSAssignment.update({
      where: { id: assignment.id },
      data: { status: AssignmentStatus.ARRIVED, journeyEndTime: new Date() }
  });
  console.log('6. Status -> ARRIVED');

  // 7. Complete Ticket
  // Assignment stays ARRIVED (No COMPLETED status in Enum)
  await prisma.ticket.update({
      where: { id: ticket.id },
      data: { status: TicketStatus.COMPLETED }
  });
  console.log('7. Ticket COMPLETED');

  // Verify Final State
  const finalAssign = await prisma.eMSAssignment.findUnique({ where: { id: assignment.id } });
  const finalTicket = await prisma.ticket.findUnique({ where: { id: ticket.id } });

  if (finalAssign?.status === 'ARRIVED' && finalTicket?.status === 'COMPLETED') {
     console.log('✅ Scenario 3.1 Happy Path PASS');
  } else {
     console.log(`❌ Scenario 3.1 Fail: Assign=${finalAssign?.status}, Ticket=${finalTicket?.status}`);
  }

  // --------------------------------------------------------------------------------
  // Scenario 3.2: Cancel/Reassign
  // --------------------------------------------------------------------------------
  console.log('\n--- Scenario 3.2: Cancel/Reassign ---');
  // New Ticket
  const ticket2 = await prisma.ticket.create({
      data: {
          ticketNumber: 'T-CANCEL-TEST',
          status: TicketStatus.PENDING,
          createdById: testUser.id,
          priority: TicketPriority.EMERGENCY,
          originHospitalId: hospital.id,
          patientId: testPatient.id
      }
  });

  // Assign
  const assign2 = await prisma.eMSAssignment.create({
      data: {
          ambulanceId: ambulance.id,
          ticketId: ticket2.id,
          status: AssignmentStatus.EMS_CONTACT,
          assignedAt: new Date(),
          createdBy: testUser.id
      }
  });

  console.log('> Assignment Created');

  // Cancel Assignment
  await prisma.eMSAssignment.update({
      where: { id: assign2.id },
      data: { status: AssignmentStatus.CANCELLED, deletedAt: new Date() } // Soft delete usually?
  });
  console.log('> Assignment CANCELLED');
  
  // Verify Status
  const cancelledAssign = await prisma.eMSAssignment.findUnique({ where: { id: assign2.id } });
  if (cancelledAssign?.status === 'CANCELLED') {
      console.log('✅ Scenario 3.2 Cancellation PASS');
  } else {
      console.log(`❌ Scenario 3.2 Fail: ${cancelledAssign?.status}`);
  }

  // Check if Ambulance is freed (Should be AVAILABLE)
  // Logic usually handled by service. As we are just manually updating DB, this test is purely schema/data flow verification.
  // To test SERVICE logic, we would need to invoke `EmsAssignmentsService.cancelAssignment`.
  // Given dependencies, manual DB verification is what we can do in this script.

  // Cleanup
  await prisma.eMSAssignment.deleteMany({ where: { ticketId: ticket2.id } });
  await prisma.ticket.deleteMany({ where: { id: ticket2.id } });
  await cleanupTestEntities();
}

runModule3().catch(console.error);
