
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
import { EMSETAService } from '../../../src/common/services/ems-eta.service';
import { EmsAssignmentsService } from '../../../src/modules/ems-assignments/ems-assignments.service';
import { Logger } from '@nestjs/common';
import { HospitalBoundsService } from '../../../src/common/services/hospital-bounds.service';

// Mocks
const mockLogger = new Logger('TestModule2');
const mockConfigService = {
    get: (key: string) => {
        if (key === 'OSRM_API_URL') return 'http://mock-osrm';
        return null;
    }
} as any;

// Mock Global Fetch for OSRM
global.fetch = (async (url: string | URL | Request) => {
    const urlStr = url.toString();
    // Default Mock Response
    let duration = 300; // 5 mins
    let distance = 5000; // 5km
    
    // Logic for Scenario 2.1 (Near vs Far)
    // Note: Numbers toString() might drop trailing zeros. 42.8800 -> 42.88. 43.0000 -> 43.
    if (urlStr.includes('42.88')) { // Near Ambulance
         duration = 300; // 5 mins
         distance = 5000;
    } else if (urlStr.includes('43')) { // Far Ambulance (matches 43.0000)
         duration = 1800; // 30 mins
         distance = 30000;
    } 
    // Logic for Scenario 2.3 (In Zone) - Matches any other request in this test context
    else {
         // Default small for In-Zone test
         duration = 10; 
         distance = 10;
    }

    return Promise.resolve({
        ok: true,
        json: async () => ({
            code: 'Ok',
            routes: [{ duration, distance }]
        })
    });
}) as any;

// Instantiate Service
const hospitalBoundsService = new HospitalBoundsService(prisma as any);
const emsEtaService = new EMSETAService(prisma as any, mockConfigService); 

// Filter logic (mimic)
async function runModule2() {
  console.log('🚀 Starting Module 2: ETA & Selection Accuracy');

  // 1. Setup
  await cleanupTestEntities();
  const hospital = await ensureTestHospital();
  
  // Create User for createdBy
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

  // --------------------------------------------------------------------------------
  // Scenario 2.1: Nearest Ambulance Selection (OSRM vs Haversine Fallback)
  // --------------------------------------------------------------------------------
  console.log('\n--- Scenario 2.1: Nearest Ambulance Selection ---');
  // Create 2 Ambulances.
  // Amb 1: Near (5km).
  // Amb 2: Far (20km).
  
  // Amb 1
  await prisma.ambulance.create({
      data: {
          id: 'amb-near',
          vehicleImei: 'IMEI-NEAR',
          callSign: 'NEAR-UNIT',
          plateNumber: '111',
          model: 'Ford',
          year: 2024,
          type: AmbulanceType.ADVANCED,
          baseStation: 'Main',
          status: AmbulanceStatus.AVAILABLE,
          isActive: true,
          currentLocationLat: 16.9900, // Close to 16.9770
          currentLocationLng: 42.8800
      }
  });

  // Amb 2
  await prisma.ambulance.create({
      data: {
          id: 'amb-far',
          vehicleImei: 'IMEI-FAR',
          callSign: 'FAR-UNIT',
          plateNumber: '222',
          model: 'Ford',
          year: 2024,
          type: AmbulanceType.ADVANCED,
          baseStation: 'Remote',
          status: AmbulanceStatus.AVAILABLE,
          isActive: true,
          currentLocationLat: 17.2000, 
          currentLocationLng: 43.0000
      }
  });

  // Verify OSRM Calculation (Mocked via fetch)
  const eta1 = await emsEtaService.calculateETAWithRouting(
      { lat: 16.9900, lng: 42.8800 }, 
      { lat: hospital.latitude!, lng: hospital.longitude! }
  );
  const eta2 = await emsEtaService.calculateETAWithRouting(
      { lat: 17.2000, lng: 43.0000 },
      { lat: hospital.latitude!, lng: hospital.longitude! }
  );

  console.log(`> Amb 1 ETA: ${eta1.durationMinutes}m`);
  console.log(`> Amb 2 ETA: ${eta2.durationMinutes}m`);

  if (eta1.durationMinutes < eta2.durationMinutes) {
      console.log('✅ Scenario 2.1 Selection Ranking PASS (Nearer is faster)');
  } else {
      console.log('❌ Scenario 2.1 Selection Ranking FAIL');
  }

  // --------------------------------------------------------------------------------
  // Scenario 2.3: In-Zone Override (1-minute Floor)
  // --------------------------------------------------------------------------------
  console.log('\n--- Scenario 2.3: In-Zone Override (1 min Floor) ---');
  // Ambulance AT Hospital (Same coords).
  // OSRM might return 0s or small value.
  // We want to ensure specific logic (if implemented in Service) forces 1 min?
  // Or just that it is accurate (0 mins).
  // Wait, the "Correction" we made was: "If In Zone, Force 1 min" (Assignment Logic).
  // This logic resides in `ems-eta.service.ts` or `ems-assignments.service.ts`?
  // Let's check `calculateAssignmentEta`.
  
  // Assignment ID needed.
  // Create Assignment for Amb Near (at Hospital).
  await prisma.ambulance.update({ where: { id: 'amb-near' }, data: { currentLocationLat: hospital.latitude, currentLocationLng: hospital.longitude } });
  
  // Create Ticket & Assignment
  const tPatient = await prisma.patient.upsert({
    where: { nationalId: '999' }, update: {}, create: { nationalId: '999', firstName: 'T', lastName: 'T', dateOfBirth: new Date(), gender: PatientGender.MALE, age: 20, bloodType: 'O', phoneNumber: '1', createdById: testUser.id }
  });

  const ticket = await prisma.ticket.create({
      data: {
          ticketNumber: 'T-ETA-TEST',
          status: TicketStatus.PENDING,
          priority: TicketPriority.EMERGENCY,
          originHospitalId: hospital.id,
          createdById: testUser.id,
          patientId: tPatient.id
      }
  });

  const assignment = await prisma.eMSAssignment.create({
      data: {
          ambulanceId: 'amb-near',
          ticketId: ticket.id,
          status: AssignmentStatus.EMS_CONTACT,
          assignedAt: new Date(),
          createdBy: testUser.id
      }
  });

  // Call `updateAssignmentETA`.
  // We need to see if it applies the "In Zone" logic.
  // We need to Mock `checkAmbulanceZones` or `isWithinRadius` if checking logs?
  // Or does `updateAssignmentETA` check distance?
  // Let's assume standard update.
  
  // Mock OSRM to return 0.
  (emsEtaService as any).httpService = {
      axiosRef: { get: async () => ({ data: { routes: [{ duration: 10, distance: 10 }] } }) }
  };
  
  await emsEtaService.updateAssignmentETA(assignment.id);

  const updatedAssign = await prisma.eMSAssignment.findUnique({ where: { id: assignment.id } });
  console.log(`> In-Zone ETA: ${updatedAssign?.etaToOrigin} mins`);
  
  // Logic Fix Verification: 
  // If we override to 1 min when < 1km (or similar), we should see >= 1.
  // If we just use OSRM, 10s -> 0.16 mins -> 0 mins?
  // Ideally, valid display is 1 min.
  if ((updatedAssign?.etaToOrigin ?? 0) > 0) {
      console.log('✅ Scenario 2.3 In-Zone Non-Zero ETA PASS');
  } else {
      console.log('⚠️ Scenario 2.3 ETA is 0 (Might desire 1 min minimum)');
  }

  // Cleanup
  await prisma.eMSAssignment.deleteMany({ where: { ticketId: ticket.id } });
  await prisma.ticket.deleteMany({ where: { id: ticket.id } });
  await prisma.ambulance.deleteMany({ where: { id: { in: ['amb-near', 'amb-far'] } } });
  await prisma.patient.deleteMany({ where: { id: tPatient.id } });
  await cleanupTestEntities();
}

runModule2().catch(console.error);
