const { PrismaClient, AccessType } = require('@prisma/client');
const axios = require('axios');

const prisma = new PrismaClient();
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001/api/v1';

async function testAccessLogs() {
  console.log('🧪 Manual Access Log Testing with Authentication\n');
  console.log('='.repeat(60));
  
  try {
    // Step 1: Get admin user credentials
    console.log('\n📋 Step 1: Getting admin user credentials...');
    const adminUser = await prisma.user.findFirst({
      where: { 
        email: 'admin@rcc-healthcare.com',
        deletedAt: null 
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true
      }
    });
    
    if (!adminUser) {
      console.error('❌ Admin user not found');
      return;
    }
    
    console.log(`✅ Found admin user: ${adminUser.email} (${adminUser.id})\n`);
    
    // Step 2: Login and get token
    console.log('🔐 Step 2: Logging in to get JWT token...');
    let token;
    try {
      // Try to login (you may need to adjust credentials)
      const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
        email: 'admin@rcc-healthcare.com',
        password: 'admin123' // Adjust if needed
      });
      
      token = loginResponse.data.access_token || loginResponse.data.token;
      console.log(`✅ Login successful, token obtained\n`);
    } catch (loginError) {
      console.log('⚠️  Login failed, using admin user ID directly for testing');
      console.log(`   Error: ${loginError.response?.data?.message || loginError.message}\n`);
      token = null;
    }
    
    // Step 3: Get a test patient or create one
    console.log('👤 Step 3: Finding or creating test patient...');
    let testPatient = await prisma.patient.findFirst({
      where: { nationalId: '598559855985' }
    });
    
    if (!testPatient) {
      console.log('   Creating new test patient...');
      testPatient = await prisma.patient.create({
        data: {
          firstName: 'Test',
          lastName: 'Patient',
          nationalId: '598559855985',
          age: 40,
          gender: 'MALE',
          createdById: adminUser.id
        }
      });
      console.log(`✅ Created test patient: ${testPatient.nationalId} (${testPatient.id})\n`);
    } else {
      console.log(`✅ Found existing patient: ${testPatient.nationalId} (${testPatient.id})\n`);
    }
    
    // Step 4: Test CREATE operation
    console.log('📝 Step 4: Testing CREATE operation...');
    const beforeCreateLogs = await prisma.patientAccessLog.count({
      where: { 
        patientId: testPatient.id,
        accessType: AccessType.CREATE
      }
    });
    
    console.log(`   Logs before CREATE: ${beforeCreateLogs}`);
    
    // Create access log manually to simulate CREATE
    try {
      const createLog = await prisma.patientAccessLog.create({
        data: {
          patientId: testPatient.id,
          userId: adminUser.id,
          accessType: AccessType.CREATE,
          accessMethod: 'API',
          reason: 'Manual test - CREATE operation'
        }
      });
      console.log(`✅ CREATE log created: ${createLog.id}\n`);
    } catch (error) {
      console.error(`❌ Failed to create CREATE log: ${error.message}\n`);
    }
    
    // Step 5: Test UPDATE operation
    console.log('✏️  Step 5: Testing UPDATE operation...');
    const beforeUpdateLogs = await prisma.patientAccessLog.count({
      where: { 
        patientId: testPatient.id,
        accessType: AccessType.UPDATE
      }
    });
    
    console.log(`   Logs before UPDATE: ${beforeUpdateLogs}`);
    
    // Update patient age
    const newAge = testPatient.age ? testPatient.age + 1 : 45;
    try {
      await prisma.patient.update({
        where: { id: testPatient.id },
        data: { age: newAge }
      });
      console.log(`   Updated patient age to: ${newAge}`);
      
      // Create access log for UPDATE
      const updateLog = await prisma.patientAccessLog.create({
        data: {
          patientId: testPatient.id,
          userId: adminUser.id,
          accessType: AccessType.UPDATE,
          accessMethod: 'API',
          reason: 'Manual test - UPDATE operation'
        }
      });
      console.log(`✅ UPDATE log created: ${updateLog.id}\n`);
    } catch (error) {
      console.error(`❌ Failed to create UPDATE log: ${error.message}\n`);
    }
    
    // Step 6: Test VIEW operation
    console.log('👁️  Step 6: Testing VIEW operation...');
    const beforeViewLogs = await prisma.patientAccessLog.count({
      where: { 
        patientId: testPatient.id,
        accessType: AccessType.VIEW
      }
    });
    
    console.log(`   Logs before VIEW: ${beforeViewLogs}`);
    
    try {
      const viewLog = await prisma.patientAccessLog.create({
        data: {
          patientId: testPatient.id,
          userId: adminUser.id,
          accessType: AccessType.VIEW,
          accessMethod: 'API',
          reason: 'Manual test - VIEW operation'
        }
      });
      console.log(`✅ VIEW log created: ${viewLog.id}\n`);
    } catch (error) {
      console.error(`❌ Failed to create VIEW log: ${error.message}\n`);
    }
    
    // Step 7: Verify all logs were created
    console.log('✅ Step 7: Verifying all logs...');
    const allLogs = await prisma.patientAccessLog.findMany({
      where: { patientId: testPatient.id },
      orderBy: { timestamp: 'desc' },
      take: 10,
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true
          }
        },
        patient: {
          select: {
            nationalId: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });
    
    console.log(`\n📊 Found ${allLogs.length} total logs for patient ${testPatient.nationalId}:\n`);
    
    const logsByType = {};
    allLogs.forEach(log => {
      const type = log.accessType;
      if (!logsByType[type]) {
        logsByType[type] = [];
      }
      logsByType[type].push(log);
    });
    
    Object.keys(logsByType).forEach(type => {
      console.log(`  ${type}: ${logsByType[type].length} logs`);
      logsByType[type].slice(0, 3).forEach((log, idx) => {
        console.log(`    ${idx + 1}. ${log.timestamp.toISOString()} - User: ${log.user?.email || 'N/A'}`);
        console.log(`       Reason: ${log.reason || 'N/A'}`);
      });
    });
    
    // Step 8: Verify foreign key relationships
    console.log('\n🔗 Step 8: Verifying foreign key relationships...');
    let invalidRelations = 0;
    
    for (const log of allLogs) {
      // Check user relationship
      const user = await prisma.user.findUnique({
        where: { id: log.userId }
      });
      if (!user) {
        console.error(`  ❌ Log ${log.id} has invalid userId: ${log.userId}`);
        invalidRelations++;
      }
      
      // Check patient relationship
      const patient = await prisma.patient.findUnique({
        where: { id: log.patientId }
      });
      if (!patient) {
        console.error(`  ❌ Log ${log.id} has invalid patientId: ${log.patientId}`);
        invalidRelations++;
      }
    }
    
    if (invalidRelations === 0) {
      console.log('  ✅ All foreign key relationships are valid\n');
    } else {
      console.log(`  ⚠️  Found ${invalidRelations} invalid foreign key relationships\n`);
    }
    
    // Step 9: Test via API if token is available
    if (token) {
      console.log('🌐 Step 9: Testing via API with token...');
      try {
        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        };
        
        // Test GET patient (VIEW)
        console.log('   Testing GET /patients/:id (VIEW)...');
        const getResponse = await axios.get(
          `${API_BASE_URL}/patients/${testPatient.id}`,
          { headers }
        );
        console.log(`   ✅ GET request successful`);
        
        // Wait a bit for interceptor to log
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check if VIEW log was created
        const viewLogsAfter = await prisma.patientAccessLog.count({
          where: { 
            patientId: testPatient.id,
            accessType: AccessType.VIEW,
            timestamp: {
              gte: new Date(Date.now() - 5000) // Last 5 seconds
            }
          }
        });
        
        console.log(`   VIEW logs created in last 5 seconds: ${viewLogsAfter}\n`);
      } catch (apiError) {
        console.error(`   ⚠️  API test failed: ${apiError.response?.data?.message || apiError.message}\n`);
      }
    } else {
      console.log('   ⏭️  Skipping API test (no token available)\n');
    }
    
    // Final summary
    console.log('='.repeat(60));
    console.log('📈 Final Summary:');
    console.log(`   Total logs for patient: ${allLogs.length}`);
    console.log(`   CREATE logs: ${logsByType[AccessType.CREATE]?.length || 0}`);
    console.log(`   UPDATE logs: ${logsByType[AccessType.UPDATE]?.length || 0}`);
    console.log(`   VIEW logs: ${logsByType[AccessType.VIEW]?.length || 0}`);
    console.log(`   Invalid foreign keys: ${invalidRelations}`);
    console.log('='.repeat(60));
    console.log('\n✅ Testing completed!\n');
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testAccessLogs();

