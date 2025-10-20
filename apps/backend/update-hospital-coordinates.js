const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Hospital coordinates from seed data
const hospitalCoordinates = [
  {
    name: 'Jazan General Hospital (JGH)',
    latitude: 16.8957234,
    longitude: 42.5557874,
  },
  {
    name: 'King Fahad Central Hospital (KFCH)',
    latitude: 16.9220163,
    longitude: 42.7355263,
  },
  {
    name: 'Prince Mohammed Bin Nasser Hospital (PMNH)',
    latitude: 16.9951348,
    longitude: 42.6183107,
  },
  {
    name: 'Samtah General Hospital',
    latitude: 16.606612,
    longitude: 42.941007,
  },
  {
    name: 'Abu Arish General Hospital (AAGH)',
    latitude: 16.9770664,
    longitude: 42.8732559,
  },
  {
    name: 'Sabya General Hospital',
    latitude: 17.1525193,
    longitude: 42.6473855,
  },
  {
    name: 'Baysh General Hospital',
    latitude: 17.4397852,
    longitude: 42.5274381,
  },
  {
    name: 'Al-Hurrath General Hospital',
    latitude: 17.10979,
    longitude: 42.7693838,
  },
  {
    name: 'Al-Darb General Hospital',
    latitude: 17.7077154,
    longitude: 42.2166516,
  },
  {
    name: 'Al-Rayth General Hospital',
    latitude: 17.6167942,
    longitude: 42.8273415,
  },
  {
    name: 'Al-Tuwal General Hospital',
    latitude: 16.5345717,
    longitude: 42.9476277,
  },
  {
    name: 'Al-Aridha General Hospital',
    latitude: 17.0446963,
    longitude: 43.0445554,
  },
  {
    name: 'Ahad Al-Masarhah General Hospital',
    latitude: 16.733231,
    longitude: 42.937143,
  },
  {
    name: 'Bani Malik General Hospital',
    latitude: 17.3306284,
    longitude: 43.1159548,
  },
  {
    name: 'Al-Aidabi General Hospital',
    latitude: 17.2388064,
    longitude: 42.9098925,
  },
  {
    name: 'Farasan General Hospital',
    latitude: 16.6954553,
    longitude: 42.1188235,
  },
  {
    name: 'Fayfa General Hospital',
    latitude: 17.2682963,
    longitude: 43.1134234,
  },
  {
    name: 'Jazan Specialized Hospital',
    latitude: 16.806384,
    longitude: 42.6555153,
  },
];

async function updateHospitalCoordinates() {
  console.log('🏥 Updating hospital coordinates...');
  
  let updatedCount = 0;
  let skippedCount = 0;
  
  for (const hospitalData of hospitalCoordinates) {
    try {
      const result = await prisma.hospital.updateMany({
        where: {
          name: hospitalData.name,
        },
        data: {
          latitude: hospitalData.latitude,
          longitude: hospitalData.longitude,
        },
      });
      
      if (result.count > 0) {
        console.log(`✅ Updated coordinates for ${hospitalData.name}`);
        updatedCount += result.count;
      } else {
        console.log(`⚠️  Hospital ${hospitalData.name} not found, skipping...`);
        skippedCount++;
      }
    } catch (error) {
      console.error(`❌ Error updating ${hospitalData.name}:`, error.message);
    }
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`✅ Updated: ${updatedCount} hospitals`);
  console.log(`⚠️  Skipped: ${skippedCount} hospitals`);
  console.log(`📝 Total processed: ${hospitalCoordinates.length} hospitals`);
}

async function main() {
  try {
    await updateHospitalCoordinates();
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
