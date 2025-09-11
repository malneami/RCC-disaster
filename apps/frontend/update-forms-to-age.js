#!/usr/bin/env node

/**
 * Helper script to identify all files that need to be updated for dateOfBirth to age migration
 * This script scans the frontend codebase and identifies:
 * 1. Files that use dateOfBirth in forms
 * 2. Files that calculate age from dateOfBirth
 * 3. Files that display age information
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const frontendDir = path.join(__dirname);

function findFilesWithPattern(dir, pattern, extensions = ['.tsx', '.ts', '.js', '.jsx']) {
  const results = [];
  
  function scanDirectory(currentDir) {
    const files = fs.readdirSync(currentDir);
    
    for (const file of files) {
      const filePath = path.join(currentDir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
        scanDirectory(filePath);
      } else if (stat.isFile() && extensions.some(ext => file.endsWith(ext))) {
        const content = fs.readFileSync(filePath, 'utf8');
        if (pattern.test(content)) {
          results.push({
            file: path.relative(frontendDir, filePath),
            matches: content.match(new RegExp(pattern.source, 'g')) || []
          });
        }
      }
    }
  }
  
  scanDirectory(dir);
  return results;
}

console.log('🔍 Scanning frontend codebase for dateOfBirth to age migration...\n');

// Pattern 1: Files using dateOfBirth in forms
console.log('📝 Files using dateOfBirth in forms:');
const formFiles = findFilesWithPattern(frontendDir, /dateOfBirth.*input|input.*dateOfBirth|dateOfBirth.*field|field.*dateOfBirth/i);
formFiles.forEach(({ file, matches }) => {
  console.log(`   - ${file} (${matches.length} matches)`);
});

// Pattern 2: Files calculating age from dateOfBirth
console.log('\n🧮 Files calculating age from dateOfBirth:');
const calculationFiles = findFilesWithPattern(frontendDir, /calculateAge|getAge|age.*dateOfBirth|dateOfBirth.*age/i);
calculationFiles.forEach(({ file, matches }) => {
  console.log(`   - ${file} (${matches.length} matches)`);
});

// Pattern 3: Files displaying age information
console.log('\n👁️ Files displaying age information:');
const displayFiles = findFilesWithPattern(frontendDir, /age.*years|years.*age|age.*old|old.*age/i);
displayFiles.forEach(({ file, matches }) => {
  console.log(`   - ${file} (${matches.length} matches)`);
});

// Pattern 4: Files with date picker components
console.log('\n📅 Files with date picker components:');
const datePickerFiles = findFilesWithPattern(frontendDir, /DatePicker|date.*picker|birthday|birth.*date/i);
datePickerFiles.forEach(({ file, matches }) => {
  console.log(`   - ${file} (${matches.length} matches)`);
});

// Pattern 5: Files with patient form validation
console.log('\n✅ Files with patient form validation:');
const validationFiles = findFilesWithPattern(frontendDir, /dateOfBirth.*required|required.*dateOfBirth|dateOfBirth.*validation|validation.*dateOfBirth/i);
validationFiles.forEach(({ file, matches }) => {
  console.log(`   - ${file} (${matches.length} matches)`);
});

console.log('\n📋 Summary of changes needed:');
console.log('1. Replace dateOfBirth input fields with age number inputs');
console.log('2. Remove calculateAge() functions and use age field directly');
console.log('3. Update form validation to require age instead of dateOfBirth');
console.log('4. Update age display to show age field instead of calculated value');
console.log('5. Update search/filter logic to use age ranges');

console.log('\n🎯 Priority files to update:');
const priorityFiles = [
  'src/components/Common/PatientForm.tsx',
  'src/pages/Patients/components/PatientFormSteps/PersonalInfoStep.tsx',
  'src/pages/Stroke/components/CreateStrokeCase/BasicInformationStep.tsx',
  'src/pages/Stemi/components/forms/PatientInfoStep.tsx',
  'src/pages/Trauma/components/forms/PatientInfoStep.tsx',
  'src/pages/Patients/components/table/PatientTableColumns.tsx',
  'src/pages/Patients/components/cards/PatientDemographicsCard.tsx',
  'src/pages/Tickets/components/PatientSelect.tsx'
];

priorityFiles.forEach(file => {
  const filePath = path.join(frontendDir, file);
  if (fs.existsSync(filePath)) {
    console.log(`   ✅ ${file} - EXISTS`);
  } else {
    console.log(`   ❌ ${file} - NOT FOUND`);
  }
});

console.log('\n✨ Migration helper script complete!');
