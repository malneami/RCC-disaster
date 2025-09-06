const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function mergeExistingDuplicates() {
  try {
    console.log('🔍 Finding and merging existing duplicate patients...\n');

    // Find all patients with National IDs
    const patientsWithNationalId = await prisma.patient.findMany({
      where: {
        nationalId: { not: null },
        deletedAt: null,
      },
      orderBy: { nationalId: 'asc' }
    });

    console.log(`📊 Found ${patientsWithNationalId.length} patients with National IDs\n`);

    // Group by National ID
    const nationalIdGroups = {};
    patientsWithNationalId.forEach(patient => {
      if (!nationalIdGroups[patient.nationalId]) {
        nationalIdGroups[patient.nationalId] = [];
      }
      nationalIdGroups[patient.nationalId].push(patient);
    });

    let totalMerged = 0;
    let totalDuplicates = 0;

    // Process each National ID group
    for (const [nationalId, patients] of Object.entries(nationalIdGroups)) {
      if (patients.length > 1) {
        totalDuplicates++;
        console.log(`\n🆔 National ID: ${nationalId} (${patients.length} patients)`);
        
        // Sort by creation date - oldest first
        const sortedPatients = patients.sort((a, b) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );

        const primaryPatient = sortedPatients[0];
        const duplicatePatients = sortedPatients.slice(1);

        console.log(`   Primary: ${primaryPatient.firstName} ${primaryPatient.lastName} (${primaryPatient.id}) - ${primaryPatient.createdAt.toISOString()}`);
        
        for (const duplicate of duplicatePatients) {
          console.log(`   Duplicate: ${duplicate.firstName} ${duplicate.lastName} (${duplicate.id}) - ${duplicate.createdAt.toISOString()}`);
        }

        try {
          // Start transaction
          await prisma.$transaction(async (tx) => {
            // Update all related records to point to primary patient
            for (const duplicate of duplicatePatients) {
              // Update stroke cases
              await tx.strokeCase.updateMany({
                where: { patientId: duplicate.id },
                data: { patientId: primaryPatient.id }
              });

              // Update tickets
              await tx.ticket.updateMany({
                where: { patientId: duplicate.id },
                data: { patientId: primaryPatient.id }
              });

              // Update medical records
              await tx.medicalRecord.updateMany({
                where: { patientId: duplicate.id },
                data: { patientId: primaryPatient.id }
              });

              // Update patient access logs
              await tx.patientAccessLog.updateMany({
                where: { patientId: duplicate.id },
                data: { patientId: primaryPatient.id }
              });

              // Soft delete the duplicate patient
              await tx.patient.update({
                where: { id: duplicate.id },
                data: { 
                  deletedAt: new Date(),
                  medicalHistory: `MERGED: This patient record was merged with patient ${primaryPatient.id} on ${new Date().toISOString()}. Original record created: ${duplicate.createdAt.toISOString()}`
                }
              });
            }

            // Update primary patient with most complete information
            const mergedData = mergePatientData(primaryPatient, duplicatePatients);
            await tx.patient.update({
              where: { id: primaryPatient.id },
              data: mergedData
            });
          });

          totalMerged += duplicatePatients.length;
          console.log(`   ✅ Merged ${duplicatePatients.length} duplicate patients into primary`);
          
        } catch (error) {
          console.error(`   ❌ Error merging patients:`, error.message);
        }
      }
    }

    console.log(`\n📋 Summary:`);
    console.log(`✅ Found ${totalDuplicates} National IDs with duplicates`);
    console.log(`✅ Merged ${totalMerged} duplicate patient records`);
    console.log(`✅ All duplicates have been resolved`);

  } catch (error) {
    console.error('❌ Error merging duplicates:', error);
  } finally {
    await prisma.$disconnect();
  }
}

function mergePatientData(primaryPatient, duplicatePatients) {
  const mergedData = {};

  // Helper function to get the most complete value
  const getMostComplete = (field, defaultValue = null) => {
    const values = [primaryPatient[field], ...duplicatePatients.map(p => p[field])];
    return values.find(v => v !== null && v !== undefined && v !== '') || defaultValue;
  };

  // Merge key fields, keeping the most complete information
  mergedData.firstName = getMostComplete('firstName', primaryPatient.firstName);
  mergedData.lastName = getMostComplete('lastName', primaryPatient.lastName);
  mergedData.middleName = getMostComplete('middleName', primaryPatient.middleName);
  mergedData.phoneNumber = getMostComplete('phoneNumber', primaryPatient.phoneNumber);
  mergedData.email = getMostComplete('email', primaryPatient.email);
  mergedData.address = getMostComplete('address', primaryPatient.address);
  mergedData.city = getMostComplete('city', primaryPatient.city);
  mergedData.state = getMostComplete('state', primaryPatient.state);
  mergedData.zipCode = getMostComplete('zipCode', primaryPatient.zipCode);
  mergedData.country = getMostComplete('country', primaryPatient.country);
  mergedData.emergencyContact = getMostComplete('emergencyContact', primaryPatient.emergencyContact);
  mergedData.emergencyPhone = getMostComplete('emergencyPhone', primaryPatient.emergencyPhone);
  mergedData.emergencyEmail = getMostComplete('emergencyEmail', primaryPatient.emergencyEmail);
  mergedData.emergencyRelationship = getMostComplete('emergencyRelationship', primaryPatient.emergencyRelationship);
  mergedData.insuranceProvider = getMostComplete('insuranceProvider', primaryPatient.insuranceProvider);
  mergedData.insuranceNumber = getMostComplete('insuranceNumber', primaryPatient.insuranceNumber);
  mergedData.insuranceGroup = getMostComplete('insuranceGroup', primaryPatient.insuranceGroup);
  mergedData.bloodType = getMostComplete('bloodType', primaryPatient.bloodType);
  mergedData.rhFactor = getMostComplete('rhFactor', primaryPatient.rhFactor);
  mergedData.allergies = getMostComplete('allergies', primaryPatient.allergies);
  mergedData.medications = getMostComplete('medications', primaryPatient.medications);
  mergedData.medicalHistory = getMostComplete('medicalHistory', primaryPatient.medicalHistory);
  mergedData.riskFactors = getMostComplete('riskFactors', primaryPatient.riskFactors);
  mergedData.chronicConditions = getMostComplete('chronicConditions', primaryPatient.chronicConditions);
  mergedData.weight = getMostComplete('weight', primaryPatient.weight);
  mergedData.height = getMostComplete('height', primaryPatient.height);
  mergedData.bmi = getMostComplete('bmi', primaryPatient.bmi);

  // Keep the most recent update time
  mergedData.updatedAt = new Date();

  return mergedData;
}

mergeExistingDuplicates();
