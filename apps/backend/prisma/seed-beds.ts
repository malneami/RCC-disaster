import { PrismaClient, BedType, BedStatus } from '@prisma/client';

const prisma = new PrismaClient();

const BED_TYPE_MAPPING: Array<{
  totalField: keyof any;
  availableField: keyof any;
  bedType: BedType;
  unitName: string;
}> = [
  { totalField: 'icuBeds', availableField: 'icuBedsAvailable', bedType: BedType.ICU, unitName: 'ICU Unit' },
  { totalField: 'picuBeds', availableField: 'picuBedsAvailable', bedType: BedType.PICU, unitName: 'PICU Unit' },
  { totalField: 'nicuBeds', availableField: 'nicuBedsAvailable', bedType: BedType.NICU, unitName: 'NICU Unit' },
  { totalField: 'maleBeds', availableField: 'maleBedsAvailable', bedType: BedType.MALE_WARD, unitName: 'Male Ward' },
  { totalField: 'femaleBeds', availableField: 'femaleBedsAvailable', bedType: BedType.FEMALE_WARD, unitName: 'Female Ward' },
  { totalField: 'pediatricBeds', availableField: 'pediatricBedsAvailable', bedType: BedType.PEDIATRIC_WARD, unitName: 'Pediatric Ward' },
  { totalField: 'standardBeds', availableField: 'standardBedsAvailable', bedType: BedType.STANDARD_WARD, unitName: 'Standard Ward' },
  { totalField: 'strokeUnitBeds', availableField: 'strokeUnitBedsAvailable', bedType: BedType.STROKE_UNIT, unitName: 'Stroke Unit' },
];

export async function seedBeds() {
  console.log('🛏️  Starting bed migration from aggregated counts...\n');

  try {
    // Check if Unit and Bed models exist (schema migration must be run first)
    try {
      await prisma.unit.findFirst({ take: 1 });
      await prisma.bed.findFirst({ take: 1 });
    } catch (schemaError: any) {
      if (schemaError.code === 'P2021' || schemaError.message?.includes('does not exist')) {
        console.log('⚠️  Bed management tables not found. Please run schema migration first.');
        return;
      }
      throw schemaError;
    }

    const hospitals = await prisma.hospital.findMany({
      where: {
        deletedAt: null,
      },
    });

    if (hospitals.length === 0) {
      console.log('⚠️  No hospitals found. Skipping bed migration.');
      console.log('   Bed migration will run automatically when hospitals are seeded.');
      return;
    }


    let totalUnitsCreated = 0;
    let totalBedsCreated = 0;
    let hospitalsProcessed = 0;
    let hospitalsSkipped = 0;

    for (const hospital of hospitals) {
      try {
        if (!hospital.id || !hospital.name) {
          console.log(`⚠️  Skipping invalid hospital (missing id or name)`);
          hospitalsSkipped++;
          continue;
        }


        let hospitalHasBeds = false;

        for (const mapping of BED_TYPE_MAPPING) {
          try {
            const totalBeds = (hospital as any)[mapping.totalField] as number || 0;
            const availableBeds = (hospital as any)[mapping.availableField] as number || 0;

            if (totalBeds < 0 || availableBeds < 0) {
              console.log(`  ⚠️  Invalid bed counts for ${mapping.unitName}, skipping`);
              continue;
            }

            if (availableBeds > totalBeds) {
              console.log(`  ⚠️  Available beds (${availableBeds}) exceed total beds (${totalBeds}) for ${mapping.unitName}, skipping`);
              continue;
            }

            if (totalBeds <= 0) {
              continue; 
            }

            hospitalHasBeds = true;

            let unit = await prisma.unit.findFirst({
              where: {
                hospitalId: hospital.id,
                bedType: mapping.bedType,
                deletedAt: null,
              },
            });

            if (!unit) {
              try {
                unit = await prisma.unit.create({
                  data: {
                    hospitalId: hospital.id,
                    name: mapping.unitName,
                    bedType: mapping.bedType,
                    description: `${mapping.unitName} for ${hospital.name}`,
                    isActive: true,
                  },
                });
                totalUnitsCreated++;
              } catch (unitError: any) {
                if (unitError.code === 'P2002') {
                  unit = await prisma.unit.findFirst({
                    where: {
                      hospitalId: hospital.id,
                      bedType: mapping.bedType,
                      deletedAt: null,
                    },
                  });
                } else {
                  throw unitError;
                }
              }
            } else {
              console.log(` Unit already exists: ${unit.name}`);
            }

            if (!unit) {
              console.log(`    ⚠️  Could not create or find unit, skipping beds`);
              continue;
            }

            const existingBedsCount = await prisma.bed.count({
              where: {
                unitId: unit.id,
                deletedAt: null,
              },
            });

            if (existingBedsCount >= totalBeds) {
              console.log(`  Beds already exist (${existingBedsCount}), skipping creation`);
              continue;
            }

            const bedsToCreate = totalBeds - existingBedsCount;
            const occupiedBeds = totalBeds - availableBeds;
            const bedsToCreateAsOccupied = Math.max(0, Math.min(bedsToCreate, occupiedBeds - existingBedsCount));

            if (bedsToCreate <= 0) {
              continue;
            }


            const bedRecords = [];
            for (let i = 1; i <= bedsToCreate; i++) {
              const bedNumber = `${mapping.bedType}-${String(existingBedsCount + i).padStart(2, '0')}`;
              const status = i <= bedsToCreateAsOccupied ? BedStatus.OCCUPIED : BedStatus.VACANT;

              bedRecords.push({
                unitId: unit.id,
                hospitalId: hospital.id,
                bedNumber,
                status,
                isOperational: true,
              });
            }

            const batchSize = 50;
            for (let i = 0; i < bedRecords.length; i += batchSize) {
              const batch = bedRecords.slice(i, i + batchSize);
              try {
                await prisma.bed.createMany({
                  data: batch,
                  skipDuplicates: true,
                });
              } catch (batchError: any) {
                if (batchError.code === 'P2002') {
                  // Duplicate key - some beds already exist, continue
                  console.log(`    ⚠️  Some beds already exist in batch, continuing...`);
                } else {
                  throw batchError;
                }
              }
            }

            totalBedsCreated += bedsToCreate;
          } catch (bedTypeError) {
            console.error(`    ❌ Error processing ${mapping.unitName} for hospital ${hospital.name}:`, bedTypeError);
            continue;
          }
        }

        if (hospitalHasBeds) {
          hospitalsProcessed++;
        } else {
          hospitalsSkipped++;
        }
      } catch (hospitalError) {
        hospitalsSkipped++;
        continue;
      }
    }

    console.log(`\n\n✅ Bed migration completed!`);
    console.log(`   📊 Units created: ${totalUnitsCreated}`);
    console.log(`   🛏️  Beds created: ${totalBedsCreated}`);
    console.log(`   🏥 Hospitals processed: ${hospitalsProcessed}`);
    if (hospitalsSkipped > 0) {
      console.log(`   ⚠️  Hospitals skipped: ${hospitalsSkipped}`);
    }
    console.log(`\n💡 Note: Aggregated fields in Hospital table are preserved for backward compatibility.`);
    console.log(`   They should be computed from Bed records via service layer.\n`);

  } catch (error) {
    console.error('❌ Bed migration failed:', error);
    // Don't throw - allow seeding to continue even if bed migration fails
    console.error('⚠️  Continuing with other seeding operations...');
  }
}

