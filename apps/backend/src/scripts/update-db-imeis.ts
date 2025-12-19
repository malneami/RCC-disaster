import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

const GPS_API_URL = 'https://gps3.tawasolmap.com/new_api/';
const GPS_API_KEY = '7798AA377F99763506758557AC7741A1';

async function fetchAllVehicles() {
  try {
    const response = await axios.post(
      GPS_API_URL,
      {
        api_key: GPS_API_KEY,
        service: 'objects',
        imeis: '*'
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
    return [];
  }
}

async function updateDB() {
  console.log('🔄 Fetching real vehicles from API...');
  const apiVehicles = await fetchAllVehicles();

  if (!apiVehicles || apiVehicles.length === 0) {
    console.log('❌ No vehicles found in API.');
    return;
  }

  console.log(`✅ Found ${apiVehicles.length} vehicles in API.`);

  // Get existing ambulances to avoid duplicates
  const existingAmbulances = await prisma.ambulance.findMany({
    select: { vehicleImei: true }
  });
  const existingImeis = new Set(existingAmbulances.map(a => a.vehicleImei));

  let createdCount = 0;

  // Ensure we have a driver to link to
  for (const v of apiVehicles) {
    if (existingImeis.has(v.imei)) {
      continue;
    }

    // Create unique driver for this ambulance
    const driverEmail = `driver-${v.imei}@rcc.com`;
    let driver = await prisma.user.findUnique({ where: { email: driverEmail } });

    if (!driver) {
      try {
        driver = await prisma.user.create({
          data: {
            email: driverEmail,
            firstName: 'Driver',
            lastName: v.imei.substring(v.imei.length - 4),
            passwordHash: 'placeholder',
            role: 'EMS',
            status: 'ACTIVE',
            phoneNumber: `05${v.imei.substring(v.imei.length - 8)}` // Dummy phone
          }
        });
      } catch (e) {
        console.error(`Failed to create driver for ${v.imei}:`, e);
        continue;
      }
    }

    // Create new ambulance
    try {
      await prisma.ambulance.create({
        data: {
          callSign: v.name || `AMB-${v.imei.substring(v.imei.length - 4)}`,
          plateNumber: v.plate_number || `PLT-${v.imei.substring(v.imei.length - 4)}`,
          vehicleImei: v.imei,
          type: 'ADVANCED', // Default
          status: 'AVAILABLE',
          baseStation: 'Central Station',
          equipmentStatus: 'OPERATIONAL',
          isActive: true,
          model: v.model || 'Unknown',
          year: 2024,
          driverId: driver.id
        }
      });
      createdCount++;
      process.stdout.write('.');
    } catch (error: any) {
      console.error(`\n❌ Failed to create ambulance for IMEI ${v.imei}: ${error.message}`);
    }
  }

  console.log(`\n\n✅ Created ${createdCount} new ambulances in DB.`);
}

updateDB()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
