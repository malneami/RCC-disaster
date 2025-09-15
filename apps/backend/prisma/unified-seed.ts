import { 
  PrismaClient, 
  HospitalStatus, 
  TraumaLevel, 
  CriticalCaseType, 
  CriticalCaseSeverity, 
  CriticalCaseStatus, 
  HospitalTicketType, 
  HospitalTicketStatus, 
  TicketPriority, 
  UserRole, 
  UserStatus,
  AmbulanceType,
  AmbulanceStatus,
  EquipmentStatus,
  AssignmentStatus
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting comprehensive unified data seeding...');

  // Check existing data
  const existingHospitals = await prisma.hospital.count();
  const existingUsers = await prisma.user.count();
  const existingCriticalCases = await prisma.criticalCase.count();
  const existingHospitalTickets = await prisma.hospitalTicket.count();
  const existingAmbulances = await prisma.ambulance.count();
  const existingEMSAssignments = await prisma.eMSAssignment.count();

  console.log(`📊 Existing data found:`);
  console.log(`   - Hospitals: ${existingHospitals}`);
  console.log(`   - Users: ${existingUsers}`);
  console.log(`   - Critical Cases: ${existingCriticalCases}`);
  console.log(`   - Hospital Tickets: ${existingHospitalTickets}`);
  console.log(`   - Ambulances: ${existingAmbulances}`);
  console.log(`   - EMS Assignments: ${existingEMSAssignments}`);

  // Seed hospitals first (required for users)
  if (existingHospitals === 0) {
    console.log('🏥 Seeding hospitals...');
    await seedHospitals();
  } else {
    console.log('🏥 Hospitals already exist, skipping hospital seeding');
  }

  // Seed users (including development users and EMS drivers)
  if (existingUsers === 0) {
    console.log('👥 Seeding users...');
    await seedUsers();
  } else {
    console.log('👥 Users already exist, skipping user seeding');
  }

  // Seed critical cases
  if (existingCriticalCases === 0) {
    console.log('🚨 Seeding critical cases...');
    await seedCriticalCases();
  } else {
    console.log('🚨 Critical cases already exist, skipping critical case seeding');
  }

  // Seed hospital tickets
  if (existingHospitalTickets === 0) {
    console.log('🎫 Seeding hospital tickets...');
    await seedHospitalTickets();
  } else {
    console.log('🎫 Hospital tickets already exist, skipping hospital ticket seeding');
  }

  // Seed ambulances and EMS data
  if (existingAmbulances === 0) {
    console.log('🚑 Seeding ambulances and EMS data...');
    await seedAmbulancesAndEMS();
  } else {
    console.log('🚑 Ambulances already exist, skipping ambulance seeding');
  }

  console.log('✅ Unified seeding completed successfully!');
  console.log('📋 Development Login Credentials:');
  console.log('   Admin: admin@rcc-healthcare.com');
  console.log('   RCC: coordinator@rcc-healthcare.com');
  console.log('   EMS: ems@rcc-healthcare.com');
  console.log('   Data Collector: datacollector@rcc-healthcare.com');
  console.log('   Cath Lab: cathlab@rcc-healthcare.com');
  console.log('   Password: Healthcare@2024');
}

async function seedHospitals() {
  const hospitals = [
    {
      name: 'Jazan General Hospital',
      address: 'Jazan, Saudi Arabia',
      latitude: 16.8892,
      longitude: 42.5511,
      icuBeds: 20,
      icuBedsAvailable: 15,
      picuBeds: 10,
      picuBedsAvailable: 8,
      maleBeds: 100,
      maleBedsAvailable: 85,
      femaleBeds: 100,
      femaleBedsAvailable: 90,
      pediatricBeds: 50,
      pediatricBedsAvailable: 45,
      standardBeds: 200,
      standardBedsAvailable: 180,
      hasStemiService: true,
      hasStrokeService: true,
      hasTraumaService: true,
      cluster: 'Jazan',
      status: HospitalStatus.AVAILABLE,
      contactPhone: '+966 17 123 4567',
      contactEmail: 'info@jazan-hospital.com',
      emergencyDeptStatus: 'available',
      nicuBeds: 15,
      nicuBedsAvailable: 12,
      hasStrokeUnit: true,
      traumaLevel: TraumaLevel.LEVEL_2,
      hasCardiologyCenter: true,
      strokeUnitBeds: 8,
      strokeUnitBedsAvailable: 6,
      hasThrombolysis: true,
      hasThrombectomy: false,
      stroke24x7Service: true,
      avgDoorToImagingMinutes: 25,
      avgDoorToNeedleMinutes: 45,
      avgDoorToGroinMinutes: 90,
      strokeCasesPerMonth: 15,
      strokeCasesCurrentYear: 180,
      strokeSuccessRate: 0.85,
      strokeCertificationLevel: 'PRIMARY',
    },
    {
      name: 'King Fahd Central Hospital',
      address: 'Jazan, Saudi Arabia',
      latitude: 16.8892,
      longitude: 42.5511,
      icuBeds: 30,
      icuBedsAvailable: 25,
      picuBeds: 15,
      picuBedsAvailable: 12,
      maleBeds: 150,
      maleBedsAvailable: 130,
      femaleBeds: 150,
      femaleBedsAvailable: 140,
      pediatricBeds: 75,
      pediatricBedsAvailable: 70,
      standardBeds: 300,
      standardBedsAvailable: 280,
      hasStemiService: true,
      hasStrokeService: true,
      hasTraumaService: true,
      cluster: 'Jazan',
      status: HospitalStatus.AVAILABLE,
      contactPhone: '+966 17 123 4568',
      contactEmail: 'info@kfch.com',
      emergencyDeptStatus: 'available',
      nicuBeds: 20,
      nicuBedsAvailable: 18,
      hasStrokeUnit: true,
      traumaLevel: TraumaLevel.LEVEL_1,
      hasCardiologyCenter: true,
      strokeUnitBeds: 12,
      strokeUnitBedsAvailable: 10,
      hasThrombolysis: true,
      hasThrombectomy: true,
      stroke24x7Service: true,
      avgDoorToImagingMinutes: 20,
      avgDoorToNeedleMinutes: 35,
      avgDoorToGroinMinutes: 75,
      strokeCasesPerMonth: 25,
      strokeCasesCurrentYear: 300,
      strokeSuccessRate: 0.92,
      strokeCertificationLevel: 'COMPREHENSIVE',
    },
    {
      name: 'Prince Mohammed bin Nasser Hospital',
      address: 'Jazan, Saudi Arabia',
      latitude: 16.8892,
      longitude: 42.5511,
      icuBeds: 15,
      icuBedsAvailable: 12,
      picuBeds: 8,
      picuBedsAvailable: 6,
      maleBeds: 80,
      maleBedsAvailable: 70,
      femaleBeds: 80,
      femaleBedsAvailable: 75,
      pediatricBeds: 40,
      pediatricBedsAvailable: 35,
      standardBeds: 160,
      standardBedsAvailable: 145,
      hasStemiService: false,
      hasStrokeService: true,
      hasTraumaService: false,
      cluster: 'Jazan',
      status: HospitalStatus.AVAILABLE,
      contactPhone: '+966 17 123 4569',
      contactEmail: 'info@pmnh.com',
      emergencyDeptStatus: 'available',
      nicuBeds: 10,
      nicuBedsAvailable: 8,
      hasStrokeUnit: false,
      traumaLevel: TraumaLevel.LEVEL_3,
      hasCardiologyCenter: false,
      strokeUnitBeds: 0,
      strokeUnitBedsAvailable: 0,
      hasThrombolysis: false,
      hasThrombectomy: false,
      stroke24x7Service: false,
      avgDoorToImagingMinutes: 35,
      avgDoorToNeedleMinutes: 60,
      avgDoorToGroinMinutes: 120,
      strokeCasesPerMonth: 8,
      strokeCasesCurrentYear: 96,
      strokeSuccessRate: 0.70,
      strokeCertificationLevel: 'PRIMARY',
    },
  ];

  for (const hospital of hospitals) {
    await prisma.hospital.create({ data: hospital });
  }
  console.log(`✅ Created ${hospitals.length} hospitals`);
}

async function seedUsers() {
  const passwordHash = await bcrypt.hash('Healthcare@2024', 10);

  // Get hospital IDs for foreign key references
  const hospitals = await prisma.hospital.findMany({ select: { id: true, name: true } });
  const jazanHospital = hospitals.find(h => h.name === 'Jazan General Hospital');
  const kfchHospital = hospitals.find(h => h.name === 'King Fahd Central Hospital');
  const pmnhHospital = hospitals.find(h => h.name === 'Prince Mohammed bin Nasser Hospital');

  // Ensure we have at least one hospital for fallback
  if (hospitals.length === 0) {
    console.log('⚠️  No hospitals found, cannot create users');
    return;
  }

  // Development users
  const developmentUsers = [
    {
      email: 'admin@rcc-healthcare.com',
      firstName: 'System',
      lastName: 'Administrator',
      phoneNumber: '+966 50 000 0001',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
      passwordHash: passwordHash,
      hospitalId: kfchHospital?.id || hospitals[0]?.id,
    },
    {
      email: 'coordinator@rcc-healthcare.com',
      firstName: 'RCC',
      lastName: 'Coordinator',
      phoneNumber: '+966 50 000 0002',
      role: UserRole.RCC,
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
      passwordHash: passwordHash,
      hospitalId: kfchHospital?.id || hospitals[0]?.id,
    },
    {
      email: 'ems@rcc-healthcare.com',
      firstName: 'EMS',
      lastName: 'Operator',
      phoneNumber: '+966 50 000 0003',
      role: UserRole.EMS,
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
      passwordHash: passwordHash,
      hospitalId: jazanHospital?.id || hospitals[0]?.id,
    },
    {
      email: 'datacollector@rcc-healthcare.com',
      firstName: 'Data',
      lastName: 'Collector',
      phoneNumber: '+966 50 000 0004',
      role: UserRole.DATA_COLLECTOR,
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
      passwordHash: passwordHash,
      hospitalId: pmnhHospital?.id || hospitals[0]?.id,
    },
    {
      email: 'cathlab@rcc-healthcare.com',
      firstName: 'Cath Lab',
      lastName: 'Technician',
      phoneNumber: '+966 50 000 0005',
      role: UserRole.CATH_LAB_USER,
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
      passwordHash: passwordHash,
      hospitalId: kfchHospital?.id || hospitals[0]?.id,
    },
  ];

  // EMS drivers
  const emsDrivers = [
    {
      email: 'driver1@jazan-ems.com',
      firstName: 'Ahmed',
      lastName: 'Al-Rashid',
      phoneNumber: '+966501234567',
      role: UserRole.EMS,
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
      passwordHash: passwordHash,
      hospitalId: jazanHospital?.id || hospitals[0]?.id,
    },
    {
      email: 'driver2@jazan-ems.com',
      firstName: 'Fatima',
      lastName: 'Al-Zahra',
      phoneNumber: '+966501234568',
      role: UserRole.EMS,
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
      passwordHash: passwordHash,
      hospitalId: jazanHospital?.id || hospitals[0]?.id,
    },
    {
      email: 'driver3@jazan-ems.com',
      firstName: 'Mohammed',
      lastName: 'Al-Shehri',
      phoneNumber: '+966501234569',
      role: UserRole.EMS,
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
      passwordHash: passwordHash,
      hospitalId: jazanHospital?.id || hospitals[0]?.id,
    },
    {
      email: 'driver4@jazan-ems.com',
      firstName: 'Aisha',
      lastName: 'Al-Ghamdi',
      phoneNumber: '+966501234570',
      role: UserRole.EMS,
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
      passwordHash: passwordHash,
      hospitalId: jazanHospital?.id || hospitals[0]?.id,
    },
    {
      email: 'driver5@jazan-ems.com',
      firstName: 'Omar',
      lastName: 'Al-Harbi',
      phoneNumber: '+966501234571',
      role: UserRole.EMS,
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
      passwordHash: passwordHash,
      hospitalId: jazanHospital?.id || hospitals[0]?.id,
    },
  ];

  // Create all users
  const allUsers = [...developmentUsers, ...emsDrivers];
  
  for (const user of allUsers) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: { passwordHash: passwordHash },
      create: user,
    });
  }
  
  console.log(`✅ Created ${allUsers.length} users (${developmentUsers.length} development + ${emsDrivers.length} EMS drivers)`);
}

async function seedCriticalCases() {
  const hospitals = await prisma.hospital.findMany({ select: { id: true, name: true } });
  const users = await prisma.user.findMany({ select: { id: true, email: true } });

  const criticalCases = [
    {
      caseType: CriticalCaseType.STEMI,
      severity: CriticalCaseSeverity.CRITICAL,
      status: CriticalCaseStatus.ACTIVE,
      patientName: 'Ahmed Al-Rashid',
      startTime: new Date(),
      description: 'High-risk STEMI case requiring immediate PCI. Patient presents with chest pain and shortness of breath. Vitals: BP: 180/100, HR: 110, O2: 92%',
      hospitalId: hospitals[0]?.id,
      createdById: users.find(u => u.email === 'admin@rcc-healthcare.com')?.id || users[0]?.id,
    },
    {
      caseType: CriticalCaseType.STROKE,
      severity: CriticalCaseSeverity.URGENT,
      status: CriticalCaseStatus.ACTIVE,
      patientName: 'Fatima Al-Zahra',
      startTime: new Date(),
      description: 'Acute stroke requiring thrombolysis assessment. Patient presents with sudden weakness and speech difficulty. Vitals: BP: 160/90, HR: 85, O2: 95%',
      hospitalId: hospitals[1]?.id,
      createdById: users.find(u => u.email === 'coordinator@rcc-healthcare.com')?.id || users[0]?.id,
    },
    {
      caseType: CriticalCaseType.TRAUMA,
      severity: CriticalCaseSeverity.CRITICAL,
      status: CriticalCaseStatus.ACTIVE,
      patientName: 'Mohammed Al-Shehri',
      startTime: new Date(),
      description: 'Trauma case requiring immediate surgical intervention. Patient presents with multiple injuries from MVA. Vitals: BP: 90/60, HR: 120, O2: 88%',
      hospitalId: hospitals[2]?.id,
      createdById: users.find(u => u.email === 'ems@rcc-healthcare.com')?.id || users[0]?.id,
    },
  ];

  for (const case_ of criticalCases) {
    await prisma.criticalCase.create({ data: case_ });
  }
  
  console.log(`✅ Created ${criticalCases.length} critical cases`);
}

async function seedHospitalTickets() {
  const hospitals = await prisma.hospital.findMany({ select: { id: true, name: true } });
  const users = await prisma.user.findMany({ select: { id: true, email: true } });

  const hospitalTickets = [
    {
      type: HospitalTicketType.TRANSFER,
      status: HospitalTicketStatus.OPEN,
      title: 'Patient Transfer Request',
      description: 'Request for patient transfer from ICU to specialized unit',
      priority: TicketPriority.HIGH,
      hospitalId: hospitals[0]?.id,
      createdById: users.find(u => u.email === 'admin@rcc-healthcare.com')?.id || users[0]?.id,
      assignedToId: users.find(u => u.email === 'coordinator@rcc-healthcare.com')?.id || users[0]?.id,
    },
    {
      type: HospitalTicketType.CONSULTATION,
      status: HospitalTicketStatus.IN_PROGRESS,
      title: 'Cardiology Consultation',
      description: 'Urgent cardiology consultation needed for STEMI patient',
      priority: TicketPriority.CRITICAL,
      hospitalId: hospitals[1]?.id,
      createdById: users.find(u => u.email === 'coordinator@rcc-healthcare.com')?.id || users[0]?.id,
      assignedToId: users.find(u => u.email === 'cathlab@rcc-healthcare.com')?.id || users[0]?.id,
    },
    {
      type: HospitalTicketType.EMERGENCY,
      status: HospitalTicketStatus.OPEN,
      title: 'Emergency Equipment Request',
      description: 'Critical equipment malfunction in emergency department',
      priority: TicketPriority.HIGH,
      hospitalId: hospitals[2]?.id,
      createdById: users.find(u => u.email === 'ems@rcc-healthcare.com')?.id || users[0]?.id,
    },
  ];

  for (const ticket of hospitalTickets) {
    await prisma.hospitalTicket.create({ data: ticket });
  }
  
  console.log(`✅ Created ${hospitalTickets.length} hospital tickets`);
}

async function seedAmbulancesAndEMS() {
  const hospitals = await prisma.hospital.findMany({ select: { id: true, name: true } });
  const emsDrivers = await prisma.user.findMany({ 
    where: { 
      OR: [
        { email: { contains: '@jazan-ems.com' } },
        { email: { contains: '@rcc-healthcare.com' }, role: 'EMS' }
      ]
    },
    select: { id: true, firstName: true, lastName: true, phoneNumber: true }
  });

  // Real ambulance data from Jazan Health Cluster
  const ambulanceData = [
    { plate_number: 'ب د س 4900', model: '2018', year: 2018, type: 'standard', location: 'Jazan Health Cluster Emergency Management' },
    { plate_number: 'ب ح هـ 2982', model: '2018', year: 2018, type: 'standard', location: 'Jazan Health Cluster Emergency Management' },
    { plate_number: 'ب د س 4899', model: '2018', year: 2018, type: 'standard', location: 'Jazan Health Cluster Emergency Management' },
    { plate_number: 'ح ص ل 4691', model: '2014', year: 2014, type: 'standard', location: 'Jazan Health Cluster Emergency Management' },
    { plate_number: 'ح ص ل 4692', model: '2014', year: 2014, type: 'standard', location: 'Jazan Health Cluster Emergency Management' },
    { plate_number: 'ح ص ل 4697', model: '2014', year: 2014, type: 'standard', location: 'Jazan Health Cluster Emergency Management' },
    { plate_number: 'ب ح ر 7382', model: '2017', year: 2017, type: 'standard', location: 'Jazan Health Cluster Emergency Management' },
    { plate_number: 'ب ح ر 7392', model: '2017', year: 2017, type: 'standard', location: 'Jazan Health Cluster Emergency Management' },
    { plate_number: 'ب ح ر 7385', model: '2017', year: 2017, type: 'standard', location: 'Jazan Health Cluster Emergency Management' },
    { plate_number: 'ب ح ر 7381', model: '2017', year: 2017, type: 'standard', location: 'Jazan Health Cluster Emergency Management' },
    { plate_number: 'ح د ب 1357', model: '2012', year: 2012, type: 'ICU', location: 'Jazan Health Cluster Emergency Management' },
    { plate_number: 'ب ك و 4849', model: '2011', year: 2011, type: 'standard', location: 'Jazan Health Cluster Emergency Management' },
    { plate_number: 'ح ل ن 6892', model: '2015', year: 2015, type: 'standard', location: 'Jazan Health Cluster Emergency Management' },
    { plate_number: 'ح ص ل 4915', model: '2014', year: 2014, type: 'standard', location: 'Jazan Health Cluster Emergency Management' },
    { plate_number: 'ح ص ل 4696', model: '2014', year: 2014, type: 'standard', location: 'Jazan Health Cluster Emergency Management' },
  ];

  const jazanHospital = hospitals.find(h => h.name === 'Jazan General Hospital') || hospitals[0];

  if (emsDrivers.length === 0) {
    console.log('⚠️  No EMS drivers found, skipping ambulance creation');
    return;
  }

  // Create ambulances
  for (let i = 0; i < ambulanceData.length; i++) {
    const ambulance = ambulanceData[i];
    const driver = emsDrivers[i % emsDrivers.length];

    if (!driver) {
      console.log(`⚠️  No driver available for ambulance ${i + 1}, skipping`);
      continue;
    }

    await prisma.ambulance.create({
      data: {
        vehicleId: `Jazan-${i + 1}`,
        callSign: `Jazan-${i + 1}`,
        plateNumber: ambulance.plate_number,
        model: ambulance.model,
        year: ambulance.year,
        type: ambulance.type === 'ICU' ? AmbulanceType.CRITICAL_CARE : AmbulanceType.BASIC,
        manufacturer: 'Various',
        vin: `VIN${Math.random().toString(36).substring(2, 15).toUpperCase()}`,
        baseStation: ambulance.location,
        status: AmbulanceStatus.AVAILABLE,
        currentLocationLat: 16.8892 + (Math.random() - 0.5) * 0.01,
        currentLocationLng: 42.5511 + (Math.random() - 0.5) * 0.01,
        currentLocationAddress: ambulance.location,
        driverId: driver.id,
        driverName: `${driver.firstName} ${driver.lastName}`,
        driverPhone: driver.phoneNumber,
        equipmentStatus: EquipmentStatus.OPERATIONAL,
        isActive: true,
      },
    });
  }

  // Create equipment inventory for first few ambulances
  const ambulances = await prisma.ambulance.findMany({ take: 5 });
  const equipmentTypes = [
    'Defibrillator', 'Oxygen Tank', 'Stretcher', 'First Aid Kit', 'Blood Pressure Monitor',
    'Pulse Oximeter', 'IV Supplies', 'Medication Kit', 'Splints', 'Cervical Collar'
  ];

  for (const ambulance of ambulances) {
    for (const equipmentType of equipmentTypes) {
      await prisma.equipmentInventory.create({
        data: {
          ambulanceId: ambulance.id,
          equipmentType: equipmentType,
          serialNumber: `SN${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
          status: EquipmentStatus.OPERATIONAL,
          lastInspectionDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
          nextInspectionDue: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000),
          maintenanceNotes: `Standard ${equipmentType} for ambulance ${ambulance.callSign}`,
        },
      });
    }
  }

  // Create driver schedules
  for (const driver of emsDrivers) {
    const ambulance = await prisma.ambulance.findFirst({ where: { driverId: driver.id } });
    if (ambulance) {
      await prisma.driverSchedule.create({
        data: {
          driverId: driver.id,
          ambulanceId: ambulance.id,
          shiftType: 'DAY',
          shiftStart: new Date(),
          shiftEnd: new Date(Date.now() + 8 * 60 * 60 * 1000), // 8 hours later
          status: 'ACTIVE',
          notes: `Regular shift for ${driver.firstName} ${driver.lastName}`,
        },
      });
    }
  }

  console.log(`✅ Created ${ambulanceData.length} ambulances with equipment and schedules`);
}

main()
  .catch((e) => {
    console.error('❌ Error during unified seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
