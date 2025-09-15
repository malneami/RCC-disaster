import { PrismaClient, AmbulanceType, AmbulanceStatus, EquipmentStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedRealAmbulances() {
  console.log('🚑 Seeding real ambulance data from Jazan Health Cluster...');

  try {
    // First, create EMS drivers if they don't exist
    const passwordHash = await bcrypt.hash('Healthcare@2024', 10);
    
    const emsDrivers = await Promise.all([
      prisma.user.upsert({
        where: { email: 'driver1@jazan-ems.com' },
        update: {},
        create: {
          email: 'driver1@jazan-ems.com',
          firstName: 'Ahmed',
          lastName: 'Al-Rashid',
          phoneNumber: '+966501234567',
          role: 'EMS',
          status: 'ACTIVE',
          isEmailVerified: true,
          passwordHash: passwordHash,
        },
      }),
      prisma.user.upsert({
        where: { email: 'driver2@jazan-ems.com' },
        update: {},
        create: {
          email: 'driver2@jazan-ems.com',
          firstName: 'Fatima',
          lastName: 'Al-Zahra',
          phoneNumber: '+966501234568',
          role: 'EMS',
          status: 'ACTIVE',
          isEmailVerified: true,
          passwordHash: passwordHash,
        },
      }),
      prisma.user.upsert({
        where: { email: 'driver3@jazan-ems.com' },
        update: {},
        create: {
          email: 'driver3@jazan-ems.com',
          firstName: 'Mohammed',
          lastName: 'Al-Sabah',
          phoneNumber: '+966501234569',
          role: 'EMS',
          status: 'ACTIVE',
          isEmailVerified: true,
          passwordHash: passwordHash,
        },
      }),
      prisma.user.upsert({
        where: { email: 'driver4@jazan-ems.com' },
        update: {},
        create: {
          email: 'driver4@jazan-ems.com',
          firstName: 'Sara',
          lastName: 'Al-Mansouri',
          phoneNumber: '+966501234570',
          role: 'EMS',
          status: 'ACTIVE',
          isEmailVerified: true,
          passwordHash: passwordHash,
        },
      }),
    ]);

    console.log('✅ Created/updated EMS drivers');

    // Real ambulance data from Jazan Health Cluster
    const ambulanceData = [
      // Jazan Health Cluster Emergency Management
      { id: 76, plateNumber: 'ب د س 4900', model: '2018', year: 2018, type: 'standard', location: 'Jazan Health Cluster Emergency Management', status: 'available' },
      { id: 77, plateNumber: 'ب ح هـ 2982', model: '2018', year: 2018, type: 'standard', location: 'Jazan Health Cluster Emergency Management', status: 'available' },
      { id: 78, plateNumber: 'ب د س 4899', model: '2018', year: 2018, type: 'standard', location: 'Jazan Health Cluster Emergency Management', status: 'available' },
      { id: 79, plateNumber: 'ح ص ل 4691', model: '2014', year: 2014, type: 'standard', location: 'Jazan Health Cluster Emergency Management', status: 'available' },
      { id: 80, plateNumber: 'ح ص ل 4692', model: '2014', year: 2014, type: 'standard', location: 'Jazan Health Cluster Emergency Management', status: 'available' },
      { id: 81, plateNumber: 'ح ص ل 4697', model: '2014', year: 2014, type: 'standard', location: 'Jazan Health Cluster Emergency Management', status: 'available' },
      { id: 82, plateNumber: 'ب ح ر 7382', model: '2017', year: 2017, type: 'standard', location: 'Jazan Health Cluster Emergency Management', status: 'available' },
      { id: 83, plateNumber: 'ب ح ر 7392', model: '2017', year: 2017, type: 'standard', location: 'Jazan Health Cluster Emergency Management', status: 'available' },
      { id: 84, plateNumber: 'ب ح ر 7385', model: '2017', year: 2017, type: 'standard', location: 'Jazan Health Cluster Emergency Management', status: 'available' },
      { id: 85, plateNumber: 'ب ح ر 7381', model: '2017', year: 2017, type: 'standard', location: 'Jazan Health Cluster Emergency Management', status: 'available' },
      { id: 86, plateNumber: 'ب ح ر 7390', model: '2017', year: 2017, type: 'standard', location: 'Jazan Health Cluster Emergency Management', status: 'available' },
      { id: 87, plateNumber: 'ب ح ر 7383', model: '2017', year: 2017, type: 'standard', location: 'Jazan Health Cluster Emergency Management', status: 'available' },
      { id: 88, plateNumber: 'ب ح ر 7389', model: '2017', year: 2017, type: 'standard', location: 'Jazan Health Cluster Emergency Management', status: 'available' },
      { id: 89, plateNumber: 'ح د ب 1357', model: '2012', year: 2012, type: 'ICU', location: 'Jazan Health Cluster Emergency Management', status: 'available' },
      { id: 90, plateNumber: 'ب ك و 4849', model: '2011', year: 2011, type: 'standard', location: 'Jazan Health Cluster Emergency Management', status: 'available' },
      { id: 91, plateNumber: 'ح ل ن 6892', model: '2015', year: 2015, type: 'standard', location: 'Jazan Health Cluster Emergency Management', status: 'available' },
      { id: 92, plateNumber: 'ح ص ل 4915', model: '2014', year: 2014, type: 'standard', location: 'Jazan Health Cluster Emergency Management', status: 'available' },
      { id: 93, plateNumber: 'ح ص ل 4696', model: '2014', year: 2014, type: 'standard', location: 'Jazan Health Cluster Emergency Management', status: 'available' },
      { id: 94, plateNumber: 'ح ص ل 4910', model: '2014', year: 2014, type: 'standard', location: 'Jazan Health Cluster Emergency Management', status: 'available' },
      { id: 95, plateNumber: 'ح ص ل 4684', model: '2014', year: 2014, type: 'standard', location: 'Jazan Health Cluster Emergency Management (Sabya)', status: 'available' },
      { id: 96, plateNumber: 'ح ص ل 4713', model: '2014', year: 2014, type: 'standard', location: 'Jazan Health Cluster Emergency Management (Al-Madhar)', status: 'available' },
      { id: 97, plateNumber: 'ح ص ل 4909', model: '2014', year: 2014, type: 'standard', location: 'Jazan Health Cluster Emergency Management', status: 'available' },
      { id: 98, plateNumber: 'ح ص ل 4912', model: '2014', year: 2014, type: 'standard', location: 'Jazan Health Cluster Emergency Management', status: 'available' },
      { id: 99, plateNumber: 'ح ص ل 4687', model: '2014', year: 2014, type: 'standard', location: 'Jazan Health Cluster Emergency Management', status: 'available' },
      { id: 100, plateNumber: 'ا ي ك 5653', model: '2014', year: 2014, type: 'standard', location: 'Jazan Health Cluster Emergency Management', status: 'available' },
      { id: 101, plateNumber: 'أي ك 5652', model: '2014', year: 2014, type: 'standard', location: 'Jazan Health Cluster Emergency Management', status: 'available' },
      { id: 102, plateNumber: 'أي ك 5654', model: '2014', year: 2014, type: 'standard', location: 'Jazan Health Cluster Emergency Management', status: 'available' },
      { id: 103, plateNumber: 'ب ي ع 4765', model: '2011', year: 2011, type: 'standard', location: 'Jazan Health Cluster Emergency Management', status: 'available' },
      { id: 104, plateNumber: 'ح ص ل 4914', model: '2014', year: 2014, type: 'standard', location: 'Jazan Health Cluster Emergency Management', status: 'available' },
      { id: 105, plateNumber: 'ح ص ل 4913', model: '2014', year: 2014, type: 'standard', location: 'Jazan Health Cluster Emergency Management', status: 'available' },
      { id: 106, plateNumber: 'ح ص ل 4685', model: '2014', year: 2014, type: 'standard', location: 'Jazan Health Cluster Emergency Management', status: 'available' },
      { id: 107, plateNumber: 'ب ط ك 7901', model: '2024', year: 2024, type: 'standard', location: 'Jazan Health Cluster Emergency Management', status: 'available' },
      { id: 108, plateNumber: 'ب ط ك 7903', model: '2024', year: 2024, type: 'standard', location: 'Jazan Health Cluster Emergency Management', status: 'available' },
      { id: 109, plateNumber: 'ب ط ك 7904', model: '2024', year: 2024, type: 'standard', location: 'Jazan Health Cluster Emergency Management', status: 'available' },
      { id: 110, plateNumber: 'ح ل ن 6891', model: '2015', year: 2015, type: 'standard', location: 'Jazan Health Cluster Emergency Management', status: 'available' },
      { id: 111, plateNumber: 'ح ص ل 4698', model: '2014', year: 2014, type: 'standard', location: 'Jazan Health Cluster Emergency Management', status: 'available' },
      { id: 112, plateNumber: 'ب ي ع 4768', model: '2012', year: 2012, type: 'standard', location: 'Jazan Health Cluster Emergency Management', status: 'available' },
      { id: 113, plateNumber: 'ح ا ح 6185', model: '2012', year: 2012, type: 'standard', location: 'Jazan Health Cluster Emergency Management', status: 'available' },
      { id: 114, plateNumber: 'ح ص ل 4688', model: '2014', year: 2014, type: 'standard', location: 'Jazan Health Cluster Emergency Management', status: 'available' },
      { id: 115, plateNumber: 'ح ا ح 6184', model: '2014', year: 2014, type: 'standard', location: 'Jazan Health Cluster Emergency Management', status: 'available' },
      
      // Specialty Hospital
      { id: 116, plateNumber: 'ب ط ك 7902', model: '2024', year: 2024, type: 'standard', location: 'Specialty Hospital', status: 'available' },
      
      // King Fahd Hospital
      { id: 117, plateNumber: 'ب ح ر 7388', model: '2017', year: 2017, type: 'standard', location: 'King Fahd Hospital', status: 'available' },
      { id: 118, plateNumber: 'ح ص ل 4715', model: '2014', year: 2014, type: 'standard', location: 'King Fahd Hospital', status: 'available' },
      { id: 119, plateNumber: 'ب ك و 4164', model: '2011', year: 2011, type: 'standard', location: 'King Fahd Hospital', status: 'available' },
      
      // Jazan Hospital
      { id: 120, plateNumber: 'ب د س 4897', model: '2018', year: 2018, type: 'standard', location: 'Jazan Hospital', status: 'available' },
      { id: 121, plateNumber: 'ح ص ل 4712', model: '2014', year: 2014, type: 'standard', location: 'Jazan Hospital', status: 'available' },
      { id: 122, plateNumber: 'ب ي ع 4756', model: '2012', year: 2012, type: 'standard', location: 'Jazan Hospital', status: 'available' },
      
      // Abu Arish Hospital
      { id: 123, plateNumber: 'ح ص ل 4911', model: '2014', year: 2014, type: 'standard', location: 'Abu Arish Hospital', status: 'available' },
      
      // Al-Mawsim Hospital
      { id: 124, plateNumber: 'ح ص ل 4694', model: '2014', year: 2014, type: 'standard', location: 'Al-Mawsim Hospital', status: 'available' },
      { id: 125, plateNumber: 'ب ح ر 7393', model: '2017', year: 2017, type: 'standard', location: 'Al-Mawsim Hospital', status: 'available' },
      
      // Chest Diseases Hospital
      { id: 126, plateNumber: 'ب ص ن 3233', model: '2010', year: 2010, type: 'standard', location: 'Chest Diseases Hospital', status: 'available' },
      
      // Damad Hospital
      { id: 127, plateNumber: 'ب ي ع 4763', model: '2012', year: 2012, type: 'standard', location: 'Damad Hospital', status: 'available' },
      { id: 128, plateNumber: 'ب ص ع 9678', model: '2012', year: 2012, type: 'standard', location: 'Damad Hospital', status: 'available' },
      
      // Ahad Al-Masarihah Hospital
      { id: 129, plateNumber: 'ب ل ص 3786', model: '2011', year: 2011, type: 'standard', location: 'Ahad Al-Masarihah Hospital', status: 'available' },
      { id: 130, plateNumber: 'ب ح ر 7387', model: '2017', year: 2017, type: 'standard', location: 'Ahad Al-Masarihah Hospital', status: 'available' },
      
      // Sabya Hospital
      { id: 131, plateNumber: 'ب ي ع 4776', model: '2011', year: 2011, type: 'standard', location: 'Sabya Hospital', status: 'available' },
      { id: 132, plateNumber: 'ح ص ل 4917', model: '2014', year: 2014, type: 'standard', location: 'Sabya Hospital', status: 'available' },
      { id: 133, plateNumber: 'ب د س 4902', model: '2018', year: 2018, type: 'standard', location: 'Sabya Hospital', status: 'available' },
      
      // Al-Tuwal Hospital
      { id: 134, plateNumber: 'ب ك و 4963', model: '2011', year: 2011, type: 'standard', location: 'Al-Tuwal Hospital', status: 'available' },
      { id: 135, plateNumber: 'ح ص ل 4711', model: '2014', year: 2014, type: 'standard', location: 'Al-Tuwal Hospital', status: 'available' },
      { id: 136, plateNumber: 'ب ك و 5614', model: '2011', year: 2011, type: 'standard', location: 'Al-Tuwal Hospital', status: 'available' },
      
      // Farasan Hospital
      { id: 137, plateNumber: 'ح ا ح 6183', model: '2011', year: 2011, type: 'standard', location: 'Farasan Hospital', status: 'available' },
      { id: 138, plateNumber: 'ب ح ر 7386', model: '2017', year: 2017, type: 'standard', location: 'Farasan Hospital', status: 'available' },
      
      // Iradah Mental Health Hospital
      { id: 139, plateNumber: 'ب ص ع 7951', model: '2012', year: 2012, type: 'standard', location: 'Iradah Mental Health Hospital', status: 'available' },
      { id: 140, plateNumber: 'ح ص ل 4896', model: '2012', year: 2012, type: 'standard', location: 'Iradah Mental Health Hospital', status: 'available' },
      
      // Fayfa Hospital
      { id: 141, plateNumber: 'ح ص ل 4686', model: '2014', year: 2014, type: 'standard', location: 'Fayfa Hospital', status: 'available' },
      { id: 142, plateNumber: 'ح ا ح 6189', model: '2014', year: 2014, type: 'standard', location: 'Fayfa Hospital', status: 'available' },
      { id: 143, plateNumber: 'ب ط ك 7905', model: '2024', year: 2024, type: 'standard', location: 'Fayfa Hospital', status: 'available' },
      
      // Al-Harth Hospital
      { id: 144, plateNumber: 'ب ح و 7760', model: '2017', year: 2017, type: 'standard', location: 'Al-Harth Hospital', status: 'available' },
      
      // Al-Shati Health Center
      { id: 145, plateNumber: 'ب ل ص 3747', model: '2011', year: 2011, type: 'standard', location: 'Al-Shati Health Center', status: 'available' },
      
      // Middle Sector
      { id: 146, plateNumber: 'ا ي ك 5651', model: '2014', year: 2014, type: 'standard', location: 'Middle Sector', status: 'available' },
      
      // Al-Madaya Health Center
      { id: 147, plateNumber: 'ا م س 2114', model: '2010', year: 2010, type: 'standard', location: 'Al-Madaya Health Center', status: 'available' },
      
      // Al-Sahalil Health Center
      { id: 148, plateNumber: 'ب د س 4901', model: '2018', year: 2018, type: 'standard', location: 'Al-Sahalil Health Center', status: 'available' },
      { id: 149, plateNumber: 'ح اح 6186', model: '2010', year: 2010, type: 'standard', location: 'Al-Sahalil Health Center', status: 'available' },
    ];

    // Map ambulance types to our schema
    const mapAmbulanceType = (type: string): AmbulanceType => {
      switch (type.toLowerCase()) {
        case 'icu':
          return 'CRITICAL_CARE';
        case 'standard':
        default:
          return 'BASIC';
      }
    };

    // Map status to our schema
    const mapAmbulanceStatus = (status: string): AmbulanceStatus => {
      switch (status.toLowerCase()) {
        case 'available':
          return 'AVAILABLE';
        case 'in_use':
          return 'IN_USE';
        case 'maintenance':
          return 'MAINTENANCE';
        case 'out_of_service':
          return 'OUT_OF_SERVICE';
        default:
          return 'AVAILABLE';
      }
    };

    // Create ambulances
    const createdAmbulances = [];
    for (const ambulance of ambulanceData) {
      // Assign drivers cyclically
      const driverIndex = (ambulance.id - 76) % emsDrivers.length;
      const assignedDriver = emsDrivers[driverIndex];

      const ambulanceRecord = await prisma.ambulance.upsert({
        where: { id: ambulance.id.toString() },
        update: {
          plateNumber: ambulance.plateNumber,
          status: mapAmbulanceStatus(ambulance.status),
          driverId: assignedDriver.id,
          driverName: `${assignedDriver.firstName} ${assignedDriver.lastName}`,
          driverPhone: assignedDriver.phoneNumber,
        },
        create: {
          id: ambulance.id.toString(),
          vehicleId: `GPS${ambulance.id.toString().padStart(3, '0')}`,
          callSign: `${ambulance.location.split(' ')[0]}-${ambulance.id}`,
          plateNumber: ambulance.plateNumber,
          model: ambulance.model,
          year: ambulance.year,
          type: mapAmbulanceType(ambulance.type),
          manufacturer: 'Mercedes-Benz', // Default manufacturer
          vin: `WDB${ambulance.id.toString().padStart(10, '0')}`,
          baseStation: ambulance.location,
          status: mapAmbulanceStatus(ambulance.status),
          currentLocationLat: 16.8892, // Jazan coordinates
          currentLocationLng: 42.5511,
          currentLocationAddress: ambulance.location,
          driverId: assignedDriver.id,
          driverName: `${assignedDriver.firstName} ${assignedDriver.lastName}`,
          driverPhone: assignedDriver.phoneNumber,
          equipmentStatus: 'OPERATIONAL',
          isActive: true,
        },
      });

      createdAmbulances.push(ambulanceRecord);
    }

    console.log(`✅ Created/updated ${createdAmbulances.length} ambulances`);

    // Create equipment inventory for each ambulance
    const equipmentTypes = [
      'Defibrillator',
      'Oxygen Tank',
      'Stretcher',
      'First Aid Kit',
      'Blood Pressure Monitor',
      'Pulse Oximeter',
      'Medical Equipment',
      'Suction Unit',
      'Splint Set',
      'Emergency Medications',
    ];

    const equipmentInventory = [];
    for (const ambulance of createdAmbulances) {
      // Create 5-8 equipment items per ambulance
      const equipmentCount = Math.floor(Math.random() * 4) + 5;
      for (let i = 0; i < equipmentCount; i++) {
        const equipmentType = equipmentTypes[Math.floor(Math.random() * equipmentTypes.length)];
        const equipment = await prisma.equipmentInventory.create({
          data: {
            ambulanceId: ambulance.id,
            equipmentType,
            serialNumber: `SN${ambulance.id.slice(-4)}${i.toString().padStart(3, '0')}`,
            manufacturer: ['Philips', 'GE Healthcare', 'Medtronic', 'Drager', 'Hamilton'][Math.floor(Math.random() * 5)],
            model: `${equipmentType} Model ${Math.floor(Math.random() * 100) + 1}`,
            status: ['OPERATIONAL', 'OPERATIONAL', 'OPERATIONAL', 'MAINTENANCE_REQUIRED'][Math.floor(Math.random() * 4)] as EquipmentStatus,
            lastInspectionDate: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
            nextInspectionDue: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000),
            purchaseDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
            warrantyExpiry: new Date(Date.now() + Math.random() * 365 * 24 * 60 * 60 * 1000),
            location: ['Front Cabin', 'Patient Compartment', 'Storage Compartment'][Math.floor(Math.random() * 3)],
          },
        });
        equipmentInventory.push(equipment);
      }
    }

    console.log(`✅ Created ${equipmentInventory.length} equipment items`);

    // Create driver schedules for active drivers
    const driverSchedules = [];
    for (let i = 0; i < emsDrivers.length; i++) {
      const driver = emsDrivers[i];
      const ambulance = createdAmbulances[i % createdAmbulances.length];
      
      const schedule = await prisma.driverSchedule.create({
        data: {
          driverId: driver.id,
          ambulanceId: ambulance.id,
          shiftStart: new Date('2024-02-15T06:00:00Z'),
          shiftEnd: new Date('2024-02-15T18:00:00Z'),
          shiftType: 'DAY',
          status: 'ACTIVE',
          breakStart: new Date('2024-02-15T12:00:00Z'),
          breakEnd: new Date('2024-02-15T13:00:00Z'),
          overtimeHours: 0,
          notes: `Regular day shift for ${ambulance.callSign}`,
        },
      });
      driverSchedules.push(schedule);
    }

    console.log(`✅ Created ${driverSchedules.length} driver schedules`);

    console.log('🎉 Real ambulance data seeding completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - EMS Drivers: ${emsDrivers.length}`);
    console.log(`   - Ambulances: ${createdAmbulances.length}`);
    console.log(`   - Equipment Items: ${equipmentInventory.length}`);
    console.log(`   - Driver Schedules: ${driverSchedules.length}`);

  } catch (error) {
    console.error('❌ Error seeding real ambulance data:', error);
    throw error;
  }
}

// Run the seed function
if (require.main === module) {
  seedRealAmbulances()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

export default seedRealAmbulances;

