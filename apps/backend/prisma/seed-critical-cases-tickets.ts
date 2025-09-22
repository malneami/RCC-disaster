import { PrismaClient, CriticalCaseType, CriticalCaseSeverity, CriticalCaseStatus, HospitalTicketType, HospitalTicketStatus, TicketPriority } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding critical cases and hospital tickets...');

  // Get existing hospitals and users
  const hospitals = await prisma.hospital.findMany();
  const users = await prisma.user.findMany();

  if (hospitals.length === 0 || users.length === 0) {
    console.log('No hospitals or users found. Please seed hospitals and users first.');
    return;
  }

  const hospital = hospitals[0];
  const user = users[0];

  // Seed critical cases
  const criticalCases = [
    {
      patientName: 'Ahmed Al-Rashid',
      caseType: CriticalCaseType.STEMI,
      severity: CriticalCaseSeverity.CRITICAL,
      status: CriticalCaseStatus.ACTIVE,
      startTime: new Date('2024-01-15T10:30:00Z'),
      description: 'Acute STEMI requiring immediate intervention',
      hospitalId: hospital.id,
      createdById: user.id,
    },
    {
      patientName: 'Fatima Al-Zahra',
      caseType: CriticalCaseType.STROKE,
      severity: CriticalCaseSeverity.URGENT,
      status: CriticalCaseStatus.ACTIVE,
      startTime: new Date('2024-01-15T09:15:00Z'),
      description: 'Ischemic stroke with time-sensitive treatment window',
      hospitalId: hospital.id,
      createdById: user.id,
    },
    {
      patientName: 'Mohammed Al-Sayed',
      caseType: CriticalCaseType.TRAUMA,
      severity: CriticalCaseSeverity.CRITICAL,
      status: CriticalCaseStatus.ACTIVE,
      startTime: new Date('2024-01-15T08:45:00Z'),
      description: 'Multiple trauma with severe bleeding',
      hospitalId: hospital.id,
      createdById: user.id,
    },
  ];

  for (const criticalCase of criticalCases) {
    await prisma.criticalCase.create({
      data: criticalCase,
    });
  }

  // Seed hospital tickets
  const hospitalTickets = [
    {
      title: 'ICU Bed Request - STEMI Patient',
      description: 'Urgent request for ICU bed for STEMI patient requiring immediate care',
              type: HospitalTicketType.EMERGENCY,
      priority: TicketPriority.CRITICAL,
      status: HospitalTicketStatus.IN_PROGRESS,
      hospitalId: hospital.id,
      createdById: user.id,
    },
    {
      title: 'Cardiologist Consultation',
      description: 'Request for cardiologist consultation for complex case',
      type: HospitalTicketType.CONSULTATION,
      priority: TicketPriority.CRITICAL,
      status: HospitalTicketStatus.OPEN,
      hospitalId: hospital.id,
      createdById: user.id,
    },
    {
      title: 'Equipment Maintenance',
      description: 'Scheduled maintenance for medical equipment unit #3',
              type: HospitalTicketType.MAINTENANCE,
      priority: TicketPriority.MEDIUM,
      status: HospitalTicketStatus.RESOLVED,
      hospitalId: hospital.id,
      createdById: user.id,
    },
    {
      title: 'Patient Transfer Request',
      description: 'Request to transfer patient to specialized trauma center',
      type: HospitalTicketType.TRANSFER,
      priority: TicketPriority.CRITICAL,
      status: HospitalTicketStatus.OPEN,
      hospitalId: hospital.id,
      createdById: user.id,
    },
  ];

  for (const hospitalTicket of hospitalTickets) {
    await prisma.hospitalTicket.create({
      data: hospitalTicket,
    });
  }

  console.log('Critical cases and hospital tickets seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
