/**
 * NICU Portal Seed Data
 * - Marks several hospitals NICU-capable (hasNicuService + nicuLevel)
 * - Creates a NICU Unit + cots (Bed rows with nicuCotType/nicuLevel) per hospital
 * - Creates sample neonatal transfers with timeline timestamps so the KPI
 *   dashboard, capacity grid, and destination matching all show real data.
 *
 * Run:  cd apps/backend && node create-nicu-seed-data.js
 * Or:   npm run db:seed:nicu
 *
 * Idempotent: re-running updates capacity and skips transfers if already seeded
 * (gated on ticketNumber prefix NICU-SEED-).
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const LEVELS = ['LEVEL_III', 'LEVEL_III', 'LEVEL_II', 'LEVEL_I'];
const COT_TYPES = ['INCUBATOR', 'OPEN_WARMER', 'VENTILATED'];
const ACUITIES = ['RED', 'ORANGE', 'YELLOW'];
const TEAMS = ['NEONATAL_RETRIEVAL', 'ALS', 'BLS', 'AIR'];
const CONDITIONS = [
  'Respiratory Distress Syndrome (RDS)',
  'Suspected Sepsis',
  'Prematurity',
  'Hypoxic-Ischemic Encephalopathy (HIE)',
  'Duct-dependent cardiac lesion',
];
const rint = (min, max) => Math.floor(min + Math.random() * (max - min + 1));
const pick = (arr) => arr[rint(0, arr.length - 1)];
const minsAgo = (base, mins) => new Date(base.getTime() - mins * 60000);

async function main() {
  console.log('🚼 Seeding NICU portal data...');

  const creator =
    (await prisma.user.findFirst({ where: { role: 'ADMIN' } })) ||
    (await prisma.user.findFirst());
  if (!creator) {
    console.error('❌ No users found. Run `npm run db:seed:users` first.');
    process.exit(1);
  }

  const hospitals = await prisma.hospital.findMany({
    where: { deletedAt: null },
    take: 5,
    orderBy: { name: 'asc' },
  });
  if (hospitals.length < 2) {
    console.error('❌ Need at least 2 hospitals. Run `npm run db:seed:hospitals` first.');
    process.exit(1);
  }

  // 1) Mark hospitals NICU-capable + build NICU units and cots
  const nicuHospitals = hospitals.slice(0, Math.min(4, hospitals.length));
  for (let i = 0; i < nicuHospitals.length; i++) {
    const h = nicuHospitals[i];
    const level = LEVELS[i % LEVELS.length];

    await prisma.hospital.update({
      where: { id: h.id },
      data: { hasNicuService: true, nicuLevel: level },
    });

    const unit = await prisma.unit.upsert({
      where: { hospitalId_bedType: { hospitalId: h.id, bedType: 'NICU' } },
      update: { isActive: true },
      create: { hospitalId: h.id, name: 'NICU Unit', bedType: 'NICU', isActive: true },
    });

    // 6 cots per hospital, mixed types/levels, mostly vacant
    for (let b = 1; b <= 6; b++) {
      const bedNumber = `NICU-${String(b).padStart(2, '0')}`;
      const cotType = COT_TYPES[(i + b) % COT_TYPES.length];
      const status = b <= 4 ? 'VACANT' : b === 5 ? 'OCCUPIED' : 'CLEANING';
      await prisma.bed.upsert({
        where: { unitId_bedNumber: { unitId: unit.id, bedNumber } },
        update: { nicuCotType: cotType, nicuLevel: level, isOperational: true },
        create: {
          unitId: unit.id,
          hospitalId: h.id,
          bedNumber,
          status,
          isOperational: true,
          nicuCotType: cotType,
          nicuLevel: level,
        },
      });
    }
    console.log(`  ✅ ${h.name} → NICU ${level} with 6 cots`);
  }

  // 2) Sample neonatal transfers (gated on seed prefix to stay idempotent)
  const already = await prisma.ticket.findFirst({
    where: { ticketNumber: { startsWith: 'NICU-SEED-' } },
  });
  if (already) {
    console.log('ℹ️  Sample transfers already seeded — skipping (capacity refreshed above).');
    await prisma.$disconnect();
    return;
  }

  const levelRank = { LEVEL_I: 1, LEVEL_II: 2, LEVEL_III: 3 };
  const now = new Date();
  const N = 14;
  for (let i = 1; i <= N; i++) {
    const referring = pick(hospitals);
    const acuity = i <= 4 ? 'RED' : i <= 9 ? 'ORANGE' : pick(ACUITIES);
    const requiredLevel = acuity === 'RED' ? 'LEVEL_III' : acuity === 'ORANGE' ? 'LEVEL_II' : 'LEVEL_I';
    const requiredCot =
      acuity === 'RED' ? 'VENTILATED' : acuity === 'ORANGE' ? 'INCUBATOR' : 'OPEN_WARMER';

    // Destination: a NICU hospital whose level >= required (for most cases)
    const dest = nicuHospitals.find(
      (h, idx) => levelRank[LEVELS[idx % LEVELS.length]] >= levelRank[requiredLevel],
    );
    const placed = i % 5 !== 0; // ~80% placed
    const declined = i % 7 === 0;

    const createdAt = minsAgo(now, rint(60, 60 * 24 * 20)); // last 20 days
    const activatedAt = minsAgo(createdAt, -rint(2, 6));
    const neoAt = minsAgo(activatedAt, -rint(5, 20));
    const dispatchedAt = minsAgo(neoAt, -rint(8, 25));
    const arrivedAt = placed ? minsAgo(dispatchedAt, -rint(20, 55)) : null;
    const temp = arrivedAt ? Math.round((36.3 + Math.random() * 1.4) * 10) / 10 : null; // ~normothermia

    const patient = await prisma.patient.create({
      data: {
        firstName: 'Baby',
        lastName: `Seed-${String(i).padStart(2, '0')}`,
        createdById: creator.id,
      },
    });

    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber: `NICU-SEED-${String(i).padStart(4, '0')}`,
        patientId: patient.id,
        originHospitalId: referring.id,
        priority: acuity === 'RED' ? 'EMERGENCY' : acuity === 'ORANGE' ? 'CRITICAL' : 'MEDIUM',
        createdById: creator.id,
      },
    });

    await prisma.neonatalTransfer.create({
      data: {
        ticketId: ticket.id,
        patientId: patient.id,
        createdById: creator.id,
        status: arrivedAt ? 'ARRIVED' : 'DISPATCHED',
        gestationalAgeWeeks: rint(26, 40),
        birthWeightGrams: rint(800, 3600),
        ageHours: rint(1, 72),
        apgar1: rint(2, 8),
        apgar5: rint(5, 10),
        hr: rint(110, 170),
        rr: rint(40, 70),
        temp,
        spo2: rint(88, 99),
        respiratorySupport: acuity === 'RED' ? 'INVASIVE_VENT' : acuity === 'ORANGE' ? 'CPAP' : 'ROOM_AIR',
        fiO2: acuity === 'RED' ? rint(40, 90) : rint(21, 40),
        surfactantGiven: acuity === 'RED',
        suspectedConditions: [pick(CONDITIONS)],
        acuityLevel: acuity,
        requiredNicuLevel: requiredLevel,
        requiredCotType: requiredCot,
        referringFacilityId: referring.id,
        referringContactName: 'Dr. On-call',
        referringContactPhone: '0500000000',
        destinationHospitalId: placed && dest ? dest.id : null,
        acceptanceStatus: declined ? 'DECLINED' : placed ? 'ACCEPTED' : 'PENDING',
        transportTeam: pick(TEAMS),
        transportIncubator: true,
        activatedAt,
        neonatologistConnectedAt: neoAt,
        dispatchedAt,
        arrivedAt,
        createdAt,
      },
    });
  }

  console.log(`  ✅ Created ${N} sample neonatal transfers`);
  console.log('🎉 NICU seed complete.');
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
