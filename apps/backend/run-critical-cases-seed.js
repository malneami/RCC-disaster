#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

console.log('🌱 Running critical cases seed...');

try {
  // Compile TypeScript
  console.log('📦 Compiling TypeScript...');
  execSync('npx tsc prisma/seed-critical-cases.ts --outDir dist --target es2020 --module commonjs --esModuleInterop --allowSyntheticDefaultImports --skipLibCheck', {
    cwd: path.join(__dirname),
    stdio: 'inherit'
  });

  // Run the seed
  console.log('🚀 Running seed...');
  execSync('node dist/prisma/seed-critical-cases.js', {
    cwd: path.join(__dirname),
    stdio: 'inherit'
  });

  console.log('✅ Critical cases seed completed successfully!');
} catch (error) {
  console.error('❌ Seed failed:', error.message);
  process.exit(1);
}
