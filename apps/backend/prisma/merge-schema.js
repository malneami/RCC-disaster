const fs = require('fs');
const path = require('path');

// Configuration
const SCHEMA_DIR = path.join(__dirname, 'schemas');
const OUTPUT_FILE = path.join(__dirname, 'schema.prisma');
const RELATIONS_DIR = path.join(__dirname, 'relations');

// Schema file order (important for dependencies)
const SCHEMA_ORDER = [
  'enums.prisma',
  'ems-enums.prisma',
  'user.prisma',
  'hospital.prisma',
  'patient.prisma',
  'ticket.prisma',
  'critical-case.prisma',
  'hospital-ticket.prisma',
  'activity.prisma',
  'system.prisma',
  'stroke-case.prisma',
  'stroke-timeline.prisma',
  'stemi-case.prisma',
  'trauma-case.prisma',
  // EMS related schemas
  'ambulance.prisma',
  'driver-schedule.prisma',
  'ems-assignment.prisma',
  'ems-alerts.prisma',
  'ems-performance.prisma',
  'equipment-inventory.prisma',
  'gps-tracking.prisma',
  'maintenance-record.prisma',
  'timeline-events.prisma',
  // Stroke assessment and rehabilitation models
  'stroke-kpi-summary.prisma',
  'stroke-assessment-score.prisma',
  'stroke-rehabilitation.prisma'
];

// Prisma header
const PRISMA_HEADER = `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

`;

function mergeSchemaFiles() {
  console.log('🔧 Merging Prisma schema files...');
  
  let mergedContent = PRISMA_HEADER;
  
  // Process files in order
  for (const fileName of SCHEMA_ORDER) {
    const filePath = path.join(SCHEMA_DIR, fileName);
    
    if (fs.existsSync(filePath)) {
      console.log(`📄 Processing ${fileName}...`);
      const content = fs.readFileSync(filePath, 'utf8');
      mergedContent += `\n// ${fileName}\n${content}\n`;
    } else {
      console.warn(`⚠️  Warning: ${fileName} not found`);
    }
  }
  
  // Process relations directory if it exists
  if (fs.existsSync(RELATIONS_DIR)) {
    console.log('🔗 Processing relations...');
    const relationFiles = fs.readdirSync(RELATIONS_DIR)
      .filter(file => file.endsWith('.prisma'))
      .sort();
    
    for (const fileName of relationFiles) {
      const filePath = path.join(RELATIONS_DIR, fileName);
      console.log(`📄 Processing relation ${fileName}...`);
      const content = fs.readFileSync(filePath, 'utf8');
      mergedContent += `\n// Relations: ${fileName}\n${content}\n`;
    }
  }
  
  // Write merged schema
  fs.writeFileSync(OUTPUT_FILE, mergedContent);
  console.log(`✅ Schema merged successfully to ${OUTPUT_FILE}`);
  
  // Validate the merged schema
  validateMergedSchema(mergedContent);
}

function validateMergedSchema(content) {
  console.log('🔍 Validating merged schema...');
  
  // Basic validation checks
  const checks = [
    { name: 'Generator block', pattern: /generator client/, required: true },
    { name: 'Datasource block', pattern: /datasource db/, required: true },
    { name: 'User model', pattern: /model User/, required: true },
    { name: 'Hospital model', pattern: /model Hospital/, required: true },
    { name: 'CriticalCase model', pattern: /model CriticalCase/, required: true },
    { name: 'HospitalTicket model', pattern: /model HospitalTicket/, required: true },
    { name: 'StrokeCase model', pattern: /model StrokeCase/, required: false },
    { name: 'StrokeTimeline model', pattern: /model StrokeTimeline/, required: false },
    { name: 'StemiCase model', pattern: /model StemiCase/, required: false },
    { name: 'TraumaCase model', pattern: /model TraumaCase/, required: false },
    // EMS model validations
    { name: 'Ambulance model', pattern: /model Ambulance/, required: true },
    { name: 'DriverSchedule model', pattern: /model DriverSchedule/, required: true },
    { name: 'EMSAssignment model', pattern: /model EMSAssignment/, required: true },
    { name: 'EMSAlert model', pattern: /model EMSAlert/, required: true },
    { name: 'GPSTracking model', pattern: /model GPSTracking/, required: true },
    { name: 'TimelineEvent model', pattern: /model TimelineEvent/, required: true },
    // Stroke assessment and rehabilitation models
    { name: 'StrokeKpiSummary model', pattern: /model StrokeKpiSummary/, required: false },
    { name: 'StrokeAssessmentScore model', pattern: /model StrokeAssessmentScore/, required: false },
    { name: 'StrokeRehabilitation model', pattern: /model StrokeRehabilitation/, required: false },
    { name: 'Enums', pattern: /enum/, required: true },
  ];
  
  let hasErrors = false;
  
  for (const check of checks) {
    if (check.required && !check.pattern.test(content)) {
      console.error(`❌ Missing required: ${check.name}`);
      hasErrors = true;
    } else if (check.pattern.test(content)) {
      console.log(`✅ Found: ${check.name}`);
    }
  }
  
  if (!hasErrors) {
    console.log('✅ Schema validation passed');
  } else {
    console.error('❌ Schema validation failed');
    process.exit(1);
  }
}

// Run the merge
if (require.main === module) {
  mergeSchemaFiles();
}

module.exports = { mergeSchemaFiles };
