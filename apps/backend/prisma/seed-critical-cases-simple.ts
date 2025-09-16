import { PrismaClient, CriticalCaseType, CriticalCaseSeverity, CriticalCaseStatus } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedCriticalCases() {
  console.log('🚨 Seeding critical cases...');
  
  const users = await prisma.user.findMany();
  const hospitals = await prisma.hospital.findMany();
  
  if (users.length === 0 || hospitals.length === 0) {
    console.log('⚠️  No users or hospitals found for critical cases');
    return;
  }

  const criticalCases = [
    {
      patientName: 'Ahmed Al-Rashid',
      caseType: CriticalCaseType.STEMI,
      severity: CriticalCaseSeverity.CRITICAL,
      status: CriticalCaseStatus.ACTIVE,
      startTime: new Date('2024-01-15T10:30:00Z'),
      description: 'Acute STEMI requiring immediate intervention',
      hospitalId: '2',
      createdById: users[1].id,
    },
    {
      patientName: 'Fatima Al-Zahra',
      caseType: CriticalCaseType.STEMI,
      severity: CriticalCaseSeverity.URGENT,
      status: CriticalCaseStatus.ACTIVE,
      startTime: new Date('2024-01-15T09:15:00Z'),
      description: 'STEMI case transferred from regional hospital',
      hospitalId: '3',
      createdById: users[2].id,
    },
    {
      patientName: 'Mohammed Al-Sayed',
      caseType: CriticalCaseType.STROKE,
      severity: CriticalCaseSeverity.CRITICAL,
      status: CriticalCaseStatus.ACTIVE,
      startTime: new Date('2024-01-15T08:45:00Z'),
      description: 'Ischemic stroke with time-sensitive treatment window',
      hospitalId: '2',
      createdById: users[1].id,
    },
    {
      patientName: 'Aisha Al-Mansouri',
      caseType: CriticalCaseType.STROKE,
      severity: CriticalCaseSeverity.URGENT,
      status: CriticalCaseStatus.ACTIVE,
      startTime: new Date('2024-01-15T11:20:00Z'),
      description: 'Hemorrhagic stroke requiring immediate intervention',
      hospitalId: '10',
      createdById: users[3].id,
    },
    {
      patientName: 'Omar Al-Hamdan',
      caseType: CriticalCaseType.TRAUMA,
      severity: CriticalCaseSeverity.CRITICAL,
      status: CriticalCaseStatus.ACTIVE,
      startTime: new Date('2024-01-15T07:30:00Z'),
      description: 'Multiple trauma with severe bleeding',
      hospitalId: '1',
      createdById: users[2].id,
    },
    {
      patientName: 'Layla Al-Qahtani',
      caseType: CriticalCaseType.TRAUMA,
      severity: CriticalCaseSeverity.URGENT,
      status: CriticalCaseStatus.ACTIVE,
      startTime: new Date('2024-01-15T12:45:00Z'),
      description: 'Trauma case requiring immediate surgery',
      hospitalId: '4',
      createdById: users[0].id,
    },
  ];

  for (const criticalCase of criticalCases) {
    try {
      await prisma.criticalCase.create({
        data: criticalCase,
      });
    } catch (error) {
      console.log(`⚠️  Critical case for ${criticalCase.patientName} already exists, skipping...`);
    }
  }

  console.log(`✅ Critical cases seeded successfully`);
}
