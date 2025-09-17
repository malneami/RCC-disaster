import { PrismaClient, EquipmentStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function seedEMSData() {
  console.log('🌱 Seeding EMS data...');

  try {
    // Create EMS users (drivers and dispatchers)
    const emsUsers = await Promise.all([
      prisma.user.create({
        data: {
          email: 'driver1@ems.com',
          firstName: 'Ahmed',
          lastName: 'Al-Rashid',
          phoneNumber: '+966501234567',
          role: 'EMS',
          status: 'ACTIVE',
          isEmailVerified: true,
          passwordHash: '$2b$10$example_hash_1', // In real app, use proper hashing
        },
      }),
      prisma.user.create({
        data: {
          email: 'driver2@ems.com',
          firstName: 'Fatima',
          lastName: 'Al-Zahra',
          phoneNumber: '+966501234568',
          role: 'EMS',
          status: 'ACTIVE',
          isEmailVerified: true,
          passwordHash: '$2b$10$example_hash_2',
        },
      }),
      prisma.user.create({
        data: {
          email: 'dispatcher@ems.com',
          firstName: 'Mohammed',
          lastName: 'Al-Sabah',
          phoneNumber: '+966501234569',
          role: 'EMS',
          status: 'ACTIVE',
          isEmailVerified: true,
          passwordHash: '$2b$10$example_hash_3',
        },
      }),
      prisma.user.create({
        data: {
          email: 'technician@ems.com',
          firstName: 'Sara',
          lastName: 'Al-Mansouri',
          phoneNumber: '+966501234570',
          role: 'EMS',
          status: 'ACTIVE',
          isEmailVerified: true,
          passwordHash: '$2b$10$example_hash_4',
        },
      }),
    ]);

    console.log('✅ Created EMS users');

    // Create ambulances
    const ambulances = await Promise.all([
      prisma.ambulance.create({
        data: {
          vehicleImei: '123456789012345',
          callSign: 'Alpha-1',
          plateNumber: 'ABC-123',
          model: 'Mercedes Sprinter',
          year: 2023,
          type: 'BASIC',
          manufacturer: 'Mercedes-Benz',
          vin: 'WDB9066321A123456',
          baseStation: 'Jazan Central Station',
          status: 'AVAILABLE',
          currentLocationLat: 16.8892,
          currentLocationLng: 42.5511,
          currentLocationAddress: 'Jazan Central Station, Jazan, Saudi Arabia',
          driverId: emsUsers[0].id,
          driverName: 'Ahmed Al-Rashid',
          driverPhone: '+966501234567',
          equipmentStatus: 'OPERATIONAL',
          fuelLevel: 85.5,
          mileage: 12500.5,
          lastMaintenanceDate: new Date('2024-01-15'),
          nextMaintenanceDue: new Date('2024-04-15'),
          isActive: true,
        },
      }),
      prisma.ambulance.create({
        data: {
          vehicleImei: '123456789012346',
          callSign: 'Bravo-2',
          plateNumber: 'DEF-456',
          model: 'Ford Transit',
          year: 2022,
          type: 'CRITICAL_CARE',
          manufacturer: 'Ford',
          vin: '1FTBW2CM5GKA12345',
          baseStation: 'Jazan Central Station',
          status: 'AVAILABLE',
          currentLocationLat: 16.8892,
          currentLocationLng: 42.5511,
          currentLocationAddress: 'Jazan Central Station, Jazan, Saudi Arabia',
          driverId: emsUsers[1].id,
          driverName: 'Fatima Al-Zahra',
          driverPhone: '+966501234568',
          equipmentStatus: 'OPERATIONAL',
          fuelLevel: 92.0,
          mileage: 18750.0,
          lastMaintenanceDate: new Date('2024-01-20'),
          nextMaintenanceDue: new Date('2024-04-20'),
          isActive: true,
        },
      }),
      prisma.ambulance.create({
        data: {
          vehicleImei: '123456789012347',
          callSign: 'Charlie-3',
          plateNumber: 'GHI-789',
          model: 'Toyota Hiace',
          year: 2023,
          type: 'ADVANCED',
          manufacturer: 'Toyota',
          vin: 'JTFHU62P803123456',
          baseStation: 'Jazan Central Station',
          status: 'MAINTENANCE',
          currentLocationLat: 16.8892,
          currentLocationLng: 42.5511,
          currentLocationAddress: 'Jazan Central Station, Jazan, Saudi Arabia',
          equipmentStatus: 'MAINTENANCE_REQUIRED',
          fuelLevel: 45.0,
          mileage: 8750.0,
          lastMaintenanceDate: new Date('2024-02-01'),
          nextMaintenanceDue: new Date('2024-02-15'),
          isActive: true,
        },
      }),
      prisma.ambulance.create({
        data: {
          vehicleImei: '123456789012348',
          callSign: 'Delta-4',
          plateNumber: 'JKL-012',
          model: 'Mercedes Sprinter',
          year: 2021,
          type: 'CRITICAL_CARE',
          manufacturer: 'Mercedes-Benz',
          vin: 'WDB9066321A789012',
          baseStation: 'Jazan Central Station',
          status: 'OUT_OF_SERVICE',
          currentLocationLat: 16.8892,
          currentLocationLng: 42.5511,
          currentLocationAddress: 'Jazan Central Station, Jazan, Saudi Arabia',
          equipmentStatus: 'OUT_OF_SERVICE',
          fuelLevel: 0.0,
          mileage: 45600.0,
          lastMaintenanceDate: new Date('2023-12-15'),
          nextMaintenanceDue: new Date('2024-01-15'),
          isActive: false,
        },
      }),
    ]);

    console.log('✅ Created ambulances');

    // Create equipment inventory
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
    for (const ambulance of ambulances) {
      for (let i = 0; i < 5; i++) {
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

    console.log('✅ Created equipment inventory');

    // Create driver schedules
    const driverSchedules = await Promise.all([
      prisma.driverSchedule.create({
        data: {
          driverId: emsUsers[0].id,
          ambulanceId: ambulances[0].id,
          shiftStart: new Date('2024-02-15T06:00:00Z'),
          shiftEnd: new Date('2024-02-15T18:00:00Z'),
          shiftType: 'DAY',
          status: 'ACTIVE',
          breakStart: new Date('2024-02-15T12:00:00Z'),
          breakEnd: new Date('2024-02-15T13:00:00Z'),
          overtimeHours: 0,
          notes: 'Regular day shift',
        },
      }),
      prisma.driverSchedule.create({
        data: {
          driverId: emsUsers[1].id,
          ambulanceId: ambulances[1].id,
          shiftStart: new Date('2024-02-15T18:00:00Z'),
          shiftEnd: new Date('2024-02-16T06:00:00Z'),
          shiftType: 'NIGHT',
          status: 'ACTIVE',
          overtimeHours: 0,
          notes: 'Night shift coverage',
        },
      }),
      prisma.driverSchedule.create({
        data: {
          driverId: emsUsers[0].id,
          ambulanceId: ambulances[0].id,
          shiftStart: new Date('2024-02-16T06:00:00Z'),
          shiftEnd: new Date('2024-02-16T18:00:00Z'),
          shiftType: 'DAY',
          status: 'SCHEDULED',
          overtimeHours: 0,
          notes: 'Scheduled shift',
        },
      }),
    ]);

    console.log('✅ Created driver schedules');

    // Create maintenance records
    const maintenanceRecords = await Promise.all([
      prisma.maintenanceRecord.create({
        data: {
          ambulanceId: ambulances[0].id,
          type: 'PREVENTIVE',
          status: 'COMPLETED',
          description: 'Regular 10,000 km service',
          workPerformed: 'Oil change, filter replacement, brake inspection',
          scheduledDate: new Date('2024-01-15'),
          startDate: new Date('2024-01-15T08:00:00Z'),
          completionDate: new Date('2024-01-15T12:00:00Z'),
          cost: 2500.0,
          laborHours: 4.0,
          partsUsed: JSON.stringify(['Oil Filter', 'Engine Oil', 'Air Filter']),
          technicianName: 'Sara Al-Mansouri',
          mileageAtService: 10000.0,
          nextServiceDue: new Date('2024-04-15'),
          warrantyWork: false,
          createdBy: emsUsers[3].id,
        },
      }),
      prisma.maintenanceRecord.create({
        data: {
          ambulanceId: ambulances[2].id,
          type: 'CORRECTIVE',
          status: 'IN_PROGRESS',
          description: 'Engine diagnostic and repair',
          workPerformed: 'Diagnosing engine warning light',
          scheduledDate: new Date('2024-02-15'),
          startDate: new Date('2024-02-15T09:00:00Z'),
          cost: 0.0,
          laborHours: 2.0,
          technicianName: 'Sara Al-Mansouri',
          mileageAtService: 8750.0,
          warrantyWork: true,
          createdBy: emsUsers[3].id,
        },
      }),
      prisma.maintenanceRecord.create({
        data: {
          equipmentId: equipmentInventory[0].id,
          type: 'ROUTINE',
          status: 'COMPLETED',
          description: 'Monthly defibrillator inspection',
          workPerformed: 'Battery test, electrode check, calibration',
          scheduledDate: new Date('2024-02-01'),
          startDate: new Date('2024-02-01T10:00:00Z'),
          completionDate: new Date('2024-02-01T11:00:00Z'),
          cost: 150.0,
          laborHours: 1.0,
          technicianName: 'Sara Al-Mansouri',
          warrantyWork: false,
          createdBy: emsUsers[3].id,
        },
      }),
    ]);

    console.log('✅ Created maintenance records');

    // Create performance metrics
    const performanceMetrics = await Promise.all([
      prisma.eMSPerformanceMetric.create({
        data: {
          ambulanceId: ambulances[0].id,
          date: new Date('2024-02-14'),
          totalTransfers: 8,
          averageResponseTime: 12.5,
          averageTransferTime: 45.0,
          totalDistanceKm: 180.5,
          fuelConsumptionLiters: 25.5,
          maintenanceHours: 0,
          driverRating: 4.8,
          patientSatisfactionScore: 9.2,
          onTimeArrivals: 7,
          delayedArrivals: 1,
          cancelledTransfers: 0,
          equipmentFailures: 0,
        },
      }),
      prisma.eMSPerformanceMetric.create({
        data: {
          ambulanceId: ambulances[1].id,
          date: new Date('2024-02-14'),
          totalTransfers: 6,
          averageResponseTime: 15.2,
          averageTransferTime: 52.0,
          totalDistanceKm: 165.0,
          fuelConsumptionLiters: 22.8,
          maintenanceHours: 0,
          driverRating: 4.6,
          patientSatisfactionScore: 8.8,
          onTimeArrivals: 5,
          delayedArrivals: 1,
          cancelledTransfers: 0,
          equipmentFailures: 1,
        },
      }),
    ]);

    console.log('✅ Created performance metrics');

    // Create GPS tracking logs (sample data for the last 24 hours)
    const gpsLogs = [];
    const now = new Date();
    for (let i = 0; i < 24; i++) {
      const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
      const lat = 16.8892 + (Math.random() - 0.5) * 0.01; // Small variation around Jazan
      const lng = 42.5511 + (Math.random() - 0.5) * 0.01;
      
      for (const ambulance of ambulances.slice(0, 2)) { // Only active ambulances
        const log = await prisma.gPSTrackingLog.create({
          data: {
            ambulanceId: ambulance.id,
            latitude: lat,
            longitude: lng,
            speed: Math.random() * 80 + 20, // 20-100 km/h
            direction: Math.random() * 360,
            timestamp,
            fuelLevel: Math.max(0, (ambulance.fuelLevel || 0) - Math.random() * 2),
            engineStatus: Math.random() > 0.1, // 90% chance engine is on
            locationAddress: `Location ${i} near Jazan`,
            accuracy: Math.random() * 5 + 1, // 1-6 meters accuracy
          },
        });
        gpsLogs.push(log);
      }
    }

    console.log('✅ Created GPS tracking logs');

    // Create EMS alerts
    const alerts = await Promise.all([
      prisma.eMSAlert.create({
        data: {
          type: 'MAINTENANCE_DUE',
          priority: 'HIGH',
          message: 'Maintenance due for ambulance Delta-4 in 3 days',
          ambulanceId: ambulances[3].id,
          status: 'ACTIVE',
          metadata: JSON.stringify({ daysUntilDue: 3 }),
        },
      }),
      prisma.eMSAlert.create({
        data: {
          type: 'LOW_FUEL',
          priority: 'MEDIUM',
          message: 'Low fuel alert for ambulance Charlie-3: 45% remaining',
          ambulanceId: ambulances[2].id,
          status: 'ACTIVE',
          metadata: JSON.stringify({ fuelLevel: 45 }),
        },
      }),
      prisma.eMSAlert.create({
        data: {
          type: 'EQUIPMENT_FAILURE',
          priority: 'HIGH',
          message: 'Defibrillator malfunction reported in ambulance Alpha-1',
          ambulanceId: ambulances[0].id,
          equipmentId: equipmentInventory[0].id,
          status: 'ACKNOWLEDGED',
          acknowledgedBy: emsUsers[3].id,
          acknowledgedAt: new Date(),
          metadata: JSON.stringify({ equipmentType: 'Defibrillator', serialNumber: equipmentInventory[0].serialNumber }),
        },
      }),
    ]);

    console.log('✅ Created EMS alerts');

    // Create timeline events
    const timelineEvents = await Promise.all([
      prisma.timelineEvent.create({
        data: {
          eventType: 'AMBULANCE_DISPATCHED',
          eventCategory: 'EMS',
          ticketId: null, // Would be linked to actual tickets in real scenario
          ambulanceId: ambulances[0].id,
          driverId: emsUsers[0].id,
          eventTimestamp: new Date('2024-02-15T08:30:00Z'),
          eventDescription: 'Ambulance Alpha-1 dispatched to emergency call',
          eventLocation: 'Jazan Central Station',
          gpsCoordinates: JSON.stringify({ lat: 16.8892, lng: 42.5511 }),
          triggeredBy: emsUsers[2].id,
          createdById: emsUsers[2].id,
        },
      }),
      prisma.timelineEvent.create({
        data: {
          eventType: 'AMBULANCE_ARRIVED',
          eventCategory: 'EMS',
          ambulanceId: ambulances[0].id,
          driverId: emsUsers[0].id,
          eventTimestamp: new Date('2024-02-15T08:45:00Z'),
          eventDescription: 'Ambulance Alpha-1 arrived at scene',
          eventLocation: 'Emergency Scene Location',
          gpsCoordinates: JSON.stringify({ lat: 16.8950, lng: 42.5600 }),
          triggeredBy: emsUsers[0].id,
          createdById: emsUsers[0].id,
        },
      }),
      prisma.timelineEvent.create({
        data: {
          eventType: 'PATIENT_LOADED',
          eventCategory: 'EMS',
          ambulanceId: ambulances[0].id,
          driverId: emsUsers[0].id,
          eventTimestamp: new Date('2024-02-15T09:00:00Z'),
          eventDescription: 'Patient loaded into ambulance Alpha-1',
          eventLocation: 'Emergency Scene Location',
          triggeredBy: emsUsers[0].id,
          createdById: emsUsers[0].id,
        },
      }),
    ]);

    console.log('✅ Created timeline events');

    console.log('🎉 EMS data seeding completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - Users: ${emsUsers.length}`);
    console.log(`   - Ambulances: ${ambulances.length}`);
    console.log(`   - Equipment: ${equipmentInventory.length}`);
    console.log(`   - Driver Schedules: ${driverSchedules.length}`);
    console.log(`   - Maintenance Records: ${maintenanceRecords.length}`);
    console.log(`   - Performance Metrics: ${performanceMetrics.length}`);
    console.log(`   - GPS Logs: ${gpsLogs.length}`);
    console.log(`   - Alerts: ${alerts.length}`);
    console.log(`   - Timeline Events: ${timelineEvents.length}`);

  } catch (error) {
    console.error('❌ Error seeding EMS data:', error);
    throw error;
  }
}

// Run the seed function
if (require.main === module) {
  seedEMSData()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

export default seedEMSData;
