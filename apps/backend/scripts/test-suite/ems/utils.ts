
import { PrismaClient, AmbulanceStatus, AssignmentStatus, TicketStatus, UserRole, AmbulanceType } from '@prisma/client';

export const prisma = new PrismaClient();

export const TEST_HOSPITAL_ID = 'test-hospital-123';
export const TEST_AMBULANCE_ID = 'test-ambulance-123';
export const TEST_TICKET_ID = 'test-ticket-123';

// Helper to wait
export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Cleanup function to reset DB state for tests
export async function cleanupTestEntities() {
  console.log('🧹 Cleaning up test entities...');
  try {
    await prisma.ambulanceZoneLog.deleteMany({ where: { ambulanceId: TEST_AMBULANCE_ID } });
    await prisma.gPSTrackingLog.deleteMany({ where: { ambulanceId: TEST_AMBULANCE_ID } });
    
    // Delete assignments by Ambulance OR Ticket
    await prisma.eMSAssignment.deleteMany({ 
      where: { 
        OR: [
          { ambulanceId: TEST_AMBULANCE_ID },
          { ticketId: TEST_TICKET_ID },
          { ticket: { ticketNumber: 'T-MOCK' } }
        ]
      } 
    });

    await prisma.ambulance.deleteMany({ where: { id: TEST_AMBULANCE_ID } });
    await prisma.ticket.deleteMany({ 
      where: { 
        OR: [
          { id: TEST_TICKET_ID },
          { ticketNumber: 'T-MOCK' }
        ]
      } 
    });
    await prisma.hospital.deleteMany({ where: { id: TEST_HOSPITAL_ID } });
  } catch (error) {
    console.warn('Cleanup warning (might not exist yet):', error);
  }
}

// Ensure Hospital Exists (Abu Arish HQ Mock)
export async function ensureTestHospital() {
  const hospital = await prisma.hospital.upsert({
    where: { id: TEST_HOSPITAL_ID },
    update: {},
    create: {
      id: TEST_HOSPITAL_ID,
      name: 'Test Setup Hospital Zone',
      latitude: 16.9770, 
      longitude: 42.8732
    }
  });
  return hospital;
}

// Create Test Ambulance
export async function createTestAmbulance(status: AmbulanceStatus = AmbulanceStatus.AVAILABLE) {
  return await prisma.ambulance.upsert({
    where: { vehicleImei: '123456789012345' },
    update: {
      status: status,
      currentLocationLat: 16.9000,
      currentLocationLng: 42.8000
    },
    create: {
      id: TEST_AMBULANCE_ID,
      vehicleImei: '123456789012345',
      callSign: 'AUTO-TEST-UNIT',
      plateNumber: '999-TEST',
      model: 'Ford Transit',
      year: 2024,
      type: AmbulanceType.ADVANCED,
      baseStation: 'Main Station',
      status: status,
      isActive: true,
      currentLocationLat: 16.9000, // Starting outside
      currentLocationLng: 42.8000
    }
  });
}

// Logic to calculate distance (Haversine)
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c; // Distance in km
}

// Simulate GPS Update via Service (Mocking the call structure usually made by Controller/Cron)
// Note: In integration tests, we might call the service directly. 
// For this script, we'll mimic the "Service Input" object.
export function generateGPSPayload(lat: number, lng: number, timestamp: Date = new Date()) {
  return {
    elevator: 0,
    speed: 60,
    direction: 0,
    timestamp: timestamp,
    latitude: lat,
    longitude: lng,
    ambulanceId: TEST_AMBULANCE_ID
  };
}
