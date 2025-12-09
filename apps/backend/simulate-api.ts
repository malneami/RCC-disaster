import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();
const API_URL = 'http://localhost:3001/api/v1/ambulance-tracking/location';

// IMEIs from seed script
const OLD_IMEI = 'SIM-OLD-CASE';
const EARLIER_IMEI = 'SIM-EARLIER-CASE';
const NOW_IMEI = 'SIM-NOW-CASE';

// Coordinates
const ORIGIN_LAT = 24.7136;
const ORIGIN_LNG = 46.6753;
const DEST_LAT = 24.7743;
const DEST_LNG = 46.7386;

async function main() {
  console.log('Starting GPS Simulation...');

  // 1. Get Ambulance IDs
  const oldAmb = await prisma.ambulance.findUnique({ where: { vehicleImei: OLD_IMEI } });
  const earlierAmb = await prisma.ambulance.findUnique({ where: { vehicleImei: EARLIER_IMEI } });
  const nowAmb = await prisma.ambulance.findUnique({ where: { vehicleImei: NOW_IMEI } });

  if (!oldAmb || !earlierAmb || !nowAmb) {
    console.error('Ambulances not found. Run seed script first.');
    process.exit(1);
  }

  // 2. Simulate Old Case (1 Month Ago)
  console.log('Simulating Old Case...');
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  
  // Entry at Origin
  await sendUpdate(oldAmb.id, ORIGIN_LAT, ORIGIN_LNG, oneMonthAgo);
  // Exit Origin (moved slightly)
  await sendUpdate(oldAmb.id, ORIGIN_LAT + 0.01, ORIGIN_LNG + 0.01, new Date(oneMonthAgo.getTime() + 5 * 60000));
  // Entry at Dest
  await sendUpdate(oldAmb.id, DEST_LAT, DEST_LNG, new Date(oneMonthAgo.getTime() + 30 * 60000));

  // 3. Simulate Earlier Case (4 Hours Ago)
  console.log('Simulating Earlier Case...');
  const fourHoursAgo = new Date();
  fourHoursAgo.setHours(fourHoursAgo.getHours() - 4);

  // Entry at Origin
  await sendUpdate(earlierAmb.id, ORIGIN_LAT, ORIGIN_LNG, fourHoursAgo);
  // Exit Origin
  await sendUpdate(earlierAmb.id, ORIGIN_LAT + 0.01, ORIGIN_LNG + 0.01, new Date(fourHoursAgo.getTime() + 5 * 60000));
  // Entry at Dest
  await sendUpdate(earlierAmb.id, DEST_LAT, DEST_LNG, new Date(fourHoursAgo.getTime() + 30 * 60000));

  // 4. Simulate Now Case (Live)
  console.log('Simulating Now Case (Live)...');
  const path = generatePath(ORIGIN_LAT, ORIGIN_LNG, DEST_LAT, DEST_LNG, 10);

  for (let i = 0; i < path.length; i++) {
    const point = path[i];
    console.log(`Sending update ${i + 1}/${path.length} for Now Case...`);
    await sendUpdate(nowAmb.id, point.lat, point.lng, new Date());
    
    if (i < path.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
    }
  }

  console.log('Simulation completed.');
}

async function sendUpdate(ambulanceId: string, lat: number, lng: number, timestamp: Date) {
  try {
    await axios.post(API_URL, {
      ambulanceId,
      latitude: lat,
      longitude: lng,
      timestamp: timestamp.toISOString(),
      speed: 50,
      direction: 0,
      accuracy: 10
    });
  } catch (error: any) {
    console.error(`Failed to send update: ${error.message}`);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

function generatePath(startLat: number, startLng: number, endLat: number, endLng: number, steps: number) {
  const path = [];
  for (let i = 0; i <= steps; i++) {
    const ratio = i / steps;
    path.push({
      lat: startLat + (endLat - startLat) * ratio,
      lng: startLng + (endLng - startLng) * ratio
    });
  }
  return path;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
