import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();
const API_URL = 'http://localhost:3001/api/v1/ambulance-tracking/location';

// Configuration
const UPDATE_INTERVAL_MS = 10000; // 10 seconds
const MOVEMENT_SPEED = 0.001; // Degrees per update (roughly 100m)

// IMEIs from seed script
const AMBULANCE_IMEIS = ['SIM-OLD-CASE', 'SIM-EARLIER-CASE', 'SIM-NOW-CASE'];

// Hospital coordinates
const ORIGIN_LAT = 24.7136;
const ORIGIN_LNG = 46.6753;
const DEST_LAT = 24.7743;
const DEST_LNG = 46.7386;

interface AmbulanceState {
  id: string;
  imei: string;
  callSign: string;
  currentLat: number;
  currentLng: number;
  targetLat: number;
  targetLng: number;
  state: 'at_origin' | 'to_destination' | 'at_destination' | 'returning';
}

const ambulanceStates: Map<string, AmbulanceState> = new Map();
let isRunning = true;

async function initialize() {
  console.log('🚀 Initializing Continuous GPS Simulator...');
  console.log(`📡 Update interval: ${UPDATE_INTERVAL_MS / 1000}s`);
  console.log(`🎯 Target API: ${API_URL}\n`);

  // Load ambulances from database
  for (const imei of AMBULANCE_IMEIS) {
    const ambulance = await prisma.ambulance.findUnique({
      where: { vehicleImei: imei }
    });

    if (ambulance) {
      ambulanceStates.set(ambulance.id, {
        id: ambulance.id,
        imei: ambulance.vehicleImei,
        callSign: ambulance.callSign,
        currentLat: ORIGIN_LAT + (Math.random() - 0.5) * 0.01,
        currentLng: ORIGIN_LNG + (Math.random() - 0.5) * 0.01,
        targetLat: DEST_LAT,
        targetLng: DEST_LNG,
        state: 'at_origin'
      });
      console.log(`✅ Loaded ambulance: ${ambulance.callSign} (${imei})`);
    } else {
      console.warn(`⚠️  Ambulance not found: ${imei}`);
    }
  }

  console.log(`\n📍 Simulating ${ambulanceStates.size} ambulances\n`);
}

function updatePosition(state: AmbulanceState): void {
  const dx = state.targetLat - state.currentLat;
  const dy = state.targetLng - state.currentLng;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance < MOVEMENT_SPEED * 2) {
    // Reached target, switch state
    switch (state.state) {
      case 'at_origin':
        state.state = 'to_destination';
        state.targetLat = DEST_LAT;
        state.targetLng = DEST_LNG;
        console.log(`🚑 ${state.callSign}: Departing to destination`);
        break;
      case 'to_destination':
        state.state = 'at_destination';
        state.currentLat = DEST_LAT;
        state.currentLng = DEST_LNG;
        console.log(`🏥 ${state.callSign}: Arrived at destination`);
        // Stay for a bit, then return
        setTimeout(() => {
          if (ambulanceStates.has(state.id)) {
            state.state = 'returning';
            state.targetLat = ORIGIN_LAT;
            state.targetLng = ORIGIN_LNG;
            console.log(`🔄 ${state.callSign}: Returning to origin`);
          }
        }, 30000); // Wait 30 seconds
        break;
      case 'returning':
        state.state = 'at_origin';
        state.currentLat = ORIGIN_LAT;
        state.currentLng = ORIGIN_LNG;
        console.log(`🏁 ${state.callSign}: Back at origin`);
        // Wait before next trip
        setTimeout(() => {
          if (ambulanceStates.has(state.id)) {
            state.state = 'to_destination';
            state.targetLat = DEST_LAT;
            state.targetLng = DEST_LNG;
            console.log(`🚑 ${state.callSign}: Starting new trip`);
          }
        }, 20000); // Wait 20 seconds
        break;
    }
  } else {
    // Move towards target
    const ratio = MOVEMENT_SPEED / distance;
    state.currentLat += dx * ratio;
    state.currentLng += dy * ratio;
  }
}

async function sendGPSUpdate(state: AmbulanceState): Promise<void> {
  try {
    await axios.post(API_URL, {
      ambulanceId: state.id,
      latitude: state.currentLat,
      longitude: state.currentLng,
      timestamp: new Date().toISOString(),
      speed: state.state === 'at_origin' || state.state === 'at_destination' ? 0 : 60,
      direction: Math.atan2(
        state.targetLng - state.currentLng,
        state.targetLat - state.currentLat
      ) * (180 / Math.PI),
      accuracy: 10
    });
    
    // Only log every 6th update (once per minute) to reduce noise
    if (Math.random() < 0.167) {
      console.log(`📡 ${state.callSign}: (${state.currentLat.toFixed(4)}, ${state.currentLng.toFixed(4)}) [${state.state}]`);
    }
  } catch (error: any) {
    if (error.code === 'ECONNREFUSED') {
      console.error(`❌ Backend not running. Please start the backend server.`);
      process.exit(1);
    } else {
      console.error(`❌ ${state.callSign}: Failed to send update - ${error.message}`);
    }
  }
}

async function simulationLoop(): Promise<void> {
  while (isRunning) {
    // Update all ambulance positions
    for (const state of ambulanceStates.values()) {
      updatePosition(state);
      await sendGPSUpdate(state);
    }

    // Wait for next interval
    await new Promise(resolve => setTimeout(resolve, UPDATE_INTERVAL_MS));
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n\n🛑 Shutting down simulator...');
  isRunning = false;
  await prisma.$disconnect();
  console.log('✅ Cleanup complete. Goodbye!\n');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n\n🛑 Shutting down simulator...');
  isRunning = false;
  await prisma.$disconnect();
  console.log('✅ Cleanup complete. Goodbye!\n');
  process.exit(0);
});

// Main execution
async function main() {
  try {
    await initialize();
    console.log('🎬 Starting simulation loop...');
    console.log('Press Ctrl+C to stop\n');
    console.log('─'.repeat(60));
    await simulationLoop();
  } catch (error) {
    console.error('💥 Fatal error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

main();
