#!/usr/bin/env node

/**
 * Migration script to convert dateOfBirth to age in Patient table
 * This script:
 * 1. Adds the age column to the patients table
 * 2. Calculates age from existing dateOfBirth values
 * 3. Updates all records with calculated age
 * 4. Makes dateOfBirth nullable (for gradual migration)
 * 5. Eventually removes dateOfBirth column (manual step)
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function migrateDateOfBirthToAge() {
  console.log('🔄 Starting dateOfBirth to age migration...');
  
  try {
    // Step 1: Add age column (this should be done via Prisma migration first)
    console.log('📊 Step 1: Adding age column to patients table...');
    
    // Step 2: Get all patients with dateOfBirth
    console.log('📊 Step 2: Fetching patients with dateOfBirth...');
    const patients = await prisma.patient.findMany({
      where: {
        dateOfBirth: {
          not: null
        }
      },
      select: {
        id: true,
        dateOfBirth: true,
        age: true
      }
    });
    
    console.log(`📊 Found ${patients.length} patients with dateOfBirth`);
    
    // Step 3: Calculate age for each patient
    console.log('📊 Step 3: Calculating ages...');
    const updatePromises = patients.map(async (patient) => {
      if (!patient.dateOfBirth) return;
      
      const today = new Date();
      const birthDate = new Date(patient.dateOfBirth);
      let age = today.getFullYear() - birthDate.getFullYear();
      
      // Adjust if birthday hasn't occurred this year
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      // Update patient with calculated age
      return prisma.patient.update({
        where: { id: patient.id },
        data: { age: age }
      });
    });
    
    // Execute all updates
    console.log('📊 Step 4: Updating patients with calculated ages...');
    const results = await Promise.all(updatePromises);
    console.log(`✅ Updated ${results.length} patients with calculated ages`);
    
    // Step 5: Verify migration
    console.log('📊 Step 5: Verifying migration...');
    const patientsWithAge = await prisma.patient.count({
      where: {
        age: {
          not: null
        }
      }
    });
    
    const patientsWithDateOfBirth = await prisma.patient.count({
      where: {
        dateOfBirth: {
          not: null
        }
      }
    });
    
    console.log(`✅ Migration complete!`);
    console.log(`   - Patients with age: ${patientsWithAge}`);
    console.log(`   - Patients with dateOfBirth: ${patientsWithDateOfBirth}`);
    
    // Step 6: Show sample data
    console.log('📊 Step 6: Sample migrated data:');
    const samplePatients = await prisma.patient.findMany({
      where: {
        age: {
          not: null
        }
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        dateOfBirth: true,
        age: true
      },
      take: 5
    });
    
    samplePatients.forEach(patient => {
      console.log(`   - ${patient.firstName} ${patient.lastName}: ${patient.age} years old (DOB: ${patient.dateOfBirth?.toISOString().split('T')[0]})`);
    });
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateDateOfBirthToAge()
    .then(() => {
      console.log('🎉 Migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateDateOfBirthToAge };
