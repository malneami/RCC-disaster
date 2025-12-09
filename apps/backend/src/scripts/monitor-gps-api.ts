import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

const GPS_API_URL = 'http://gps3.tawasolmap.com/new_api/';
const GPS_API_KEY = '7798AA377F99763506758557AC7741A1';
const POLL_INTERVAL = 30000; // 30 seconds

async function fetchAllVehicles() {
  try {
    const response = await axios.post(
      GPS_API_URL,
      {
        api_key: GPS_API_KEY,
        service: 'objects',
        imeis: '*' // Fetch ALL vehicles
      },
      {
        timeout: 10000,
        headers: { 'Content-Type': 'application/json' }
      }
    );

    if (response.data.status && response.data.data) {
      return response.data.data;
    }
    return [];
  } catch (error: any) {
    console.error(`❌ API Error: ${error.message}`);
    if (error.response) {
      // Log partial response if available to debug ISP issues
      const dataStr = typeof error.response.data === 'string' 
        ? error.response.data.substring(0, 200) + '...' 
        : JSON.stringify(error.response.data);
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data: ${dataStr}`);
    }
    return null;
  }
}

async function monitorGPS() {
  console.log('📡 Starting GPS API Monitoring (Polling every 30s)...');
  console.log('-----------------------------------------------------');

  // 1. Get DB ambulances for comparison
  const dbAmbulances = await prisma.ambulance.findMany({
    where: { isActive: true, deletedAt: null },
    select: { id: true, vehicleImei: true, callSign: true }
  });
  const dbImeis = new Set(dbAmbulances.map(a => a.vehicleImei));
  console.log(`Loaded ${dbAmbulances.length} active ambulances from DB.`);

  // Monitoring Loop
  setInterval(async () => {
    const timestamp = new Date().toISOString();
    console.log(`\n[${timestamp}] Polling API...`);

    const apiVehicles = await fetchAllVehicles();

    if (apiVehicles === null) {
      console.log('⚠️ Skipping this poll due to API error.');
      return;
    }

    if (apiVehicles.length === 0) {
      console.log('⚠️ No vehicles returned from API.');
      return;
    }

    console.log(`✅ Received ${apiVehicles.length} vehicles from API.`);

    // Match and Log
    let matchedCount = 0;
    let freshCount = 0;
    let staleCount = 0;
    const now = new Date();

    for (const v of apiVehicles) {
      const isKnown = dbImeis.has(v.imei);
      if (!isKnown) continue;

      // Skip invalid locations
      const lat = parseFloat(v.lat);
      const lng = parseFloat(v.lng);
      if (lat === 0 && lng === 0) continue;
      if (v.loc_valid !== '1') continue;

      matchedCount++;
      const amb = dbAmbulances.find(a => a.vehicleImei === v.imei);
      
      // Parse timestamp - use dt_tracker or dt_server
      const rawTimestamp = v.dt_tracker || v.dt_server;
      let gpsTime: Date;
      let diffMinutes = 999999;
      
      try {
        gpsTime = new Date(rawTimestamp);
        if (isNaN(gpsTime.getTime()) || gpsTime.getFullYear() < 2020) {
          // Invalid or very old timestamp, use current time
          gpsTime = new Date();
          diffMinutes = 0;
        } else {
          diffMinutes = (now.getTime() - gpsTime.getTime()) / 60000;
        }
      } catch (e) {
        gpsTime = new Date();
        diffMinutes = 0;
      }

      const isFresh = diffMinutes <= 20;
      if (isFresh) freshCount++;
      else staleCount++;

      // Log sample (first 5)
      if (matchedCount <= 5) {
         console.log(`   🚑 ${amb?.callSign} (${v.imei})`);
         console.log(`      Time: ${rawTimestamp} (${Math.round(diffMinutes)} mins ago)`);
         console.log(`      Loc: ${lat}, ${lng} | Speed: ${v.speed}`);
      }

      // FORCE UPDATE DB
      try {
        // 1. Update Ambulance current location
        await prisma.ambulance.update({
          where: { id: amb!.id },
          data: {
            currentLocationLat: lat,
            currentLocationLng: lng,
            lastUpdated: new Date() // Force update timestamp
          }
        });

        // 2. Create Tracking Log
        await prisma.gPSTrackingLog.create({
          data: {
            ambulanceId: amb!.id,
            latitude: lat,
            longitude: lng,
            speed: parseFloat(v.speed) || 0,
            direction: parseFloat(v.angle || '0'),
            timestamp: gpsTime
          }
        });
      } catch (e) {
        console.error(`      ❌ Failed to update DB: ${e}`);
      }
    }

    console.log(`\n   📊 Summary:`);
    console.log(`      - Matched Ambulances: ${matchedCount}`);
    console.log(`      - Fresh Data (<20m):  ${freshCount}`);
    console.log(`      - Stale Data (>20m):  ${staleCount}`);
    
    if (freshCount === 0 && matchedCount > 0) {
      console.log(`\n   ⚠️ WARNING: No fresh data found! Using current time for tracking.`);
    } else if (matchedCount > 0) {
      console.log(`\n   ✅ Database updated with ${matchedCount} locations.`);
    } else {
      console.log(`\n   ⚠️ No valid locations found in API response.`);
    }

  }, POLL_INTERVAL);
}

// Handle cleanup
process.on('SIGINT', async () => {
  console.log('\nStopping monitoring...');
  await prisma.$disconnect();
  process.exit(0);
});

// Start
monitorGPS();
