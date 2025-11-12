const { PrismaClient, AccessType } = require('@prisma/client');
const axios = require('axios');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001/api/v1';

async function testApiAccessLogs() {
  console.log('🧪 API Access Log Testing with Authentication\n');
  console.log('='.repeat(70));
  
  try {
    // Step 1: Get or create test user
    console.log('\n👤 Step 1: Setting up test user...');
    let testUser = await prisma.user.findFirst({
      where: { email: 'test@rcc-healthcare.com' }
    });
    
    if (!testUser) {
      const hashedPassword = await bcrypt.hash('test123456', 10);
      testUser = await prisma.user.create({
        data: {
          email: 'test@rcc-healthcare.com',
          firstName: 'Test',
          lastName: 'User',
          passwordHash: hashedPassword,
          role: 'ADMIN',
          status: 'ACTIVE'
        }
      });
      console.log(`✅ Created test user: ${testUser.email}`);
    } else {
      console.log(`✅ Found existing test user: ${testUser.email}`);
    }
    console.log(`   User ID: ${testUser.id}\n`);
    
    // Step 2: Login and get token
    console.log('🔐 Step 2: Logging in to get JWT token...');
    let token;
    try {
      const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
        email: 'test@rcc-healthcare.com',
        password: 'test123456'
      });
      
      token = loginResponse.data.accessToken || loginResponse.data.access_token;
      if (!token) {
        throw new Error('No token in response');
      }
      console.log(`✅ Login successful`);
      console.log(`   Token: ${token.substring(0, 50)}...\n`);
    } catch (loginError) {
      console.error(`❌ Login failed: ${loginError.response?.data?.message || loginError.message}`);
      if (loginError.response?.data) {
        console.error(`   Response:`, JSON.stringify(loginError.response.data, null, 2));
      }
      return;
    }
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    // Step 3: Test CREATE operation
    console.log('📝 Step 3: Testing CREATE operation (create patient)...');
    const beforeCreateLogs = await prisma.patientAccessLog.count({
      where: { 
        userId: testUser.id,
        accessType: AccessType.CREATE
      }
    });
    console.log(`   Logs before CREATE: ${beforeCreateLogs}`);
    
    const testNationalId = `TEST${Date.now()}`;
    let createdPatient;
    try {
      const createResponse = await axios.post(
        `${API_BASE_URL}/patients`,
        {
          firstName: 'API',
          lastName: 'Test',
          nationalId: testNationalId,
          age: 30,
          gender: 'MALE',
          phoneNumber: '1234567890',
          address: 'Test Address'
        },
        { headers }
      );
      
      createdPatient = createResponse.data;
      console.log(`✅ Patient created: ${createdPatient.id} (${testNationalId})`);
      
      // Wait for logging to complete
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const afterCreateLogs = await prisma.patientAccessLog.count({
        where: { 
          patientId: createdPatient.id,
          userId: testUser.id,
          accessType: AccessType.CREATE
        }
      });
      console.log(`   Logs after CREATE: ${afterCreateLogs}`);
      
      if (afterCreateLogs > beforeCreateLogs) {
        console.log(`   ✅ CREATE log was created!\n`);
      } else {
        console.log(`   ⚠️  CREATE log was NOT created\n`);
      }
    } catch (createError) {
      console.error(`❌ Failed to create patient: ${createError.response?.data?.message || createError.message}\n`);
      if (createError.response?.data) {
        console.error(`   Response:`, JSON.stringify(createError.response.data, null, 2));
      }
    }
    
    // Step 4: Test UPDATE operation
    if (createdPatient) {
      console.log('✏️  Step 4: Testing UPDATE operation (update patient)...');
      const beforeUpdateLogs = await prisma.patientAccessLog.count({
        where: { 
          patientId: createdPatient.id,
          userId: testUser.id,
          accessType: AccessType.UPDATE
        }
      });
      console.log(`   Logs before UPDATE: ${beforeUpdateLogs}`);
      
      try {
        const updateResponse = await axios.put(
          `${API_BASE_URL}/patients/${createdPatient.id}`,
          {
            age: 31,
            phoneNumber: '0987654321'
          },
          { headers }
        );
        
        console.log(`✅ Patient updated: age changed to ${updateResponse.data.age}`);
        
        // Wait for logging to complete
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const afterUpdateLogs = await prisma.patientAccessLog.count({
          where: { 
            patientId: createdPatient.id,
            userId: testUser.id,
            accessType: AccessType.UPDATE
          }
        });
        console.log(`   Logs after UPDATE: ${afterUpdateLogs}`);
        
        if (afterUpdateLogs > beforeUpdateLogs) {
          console.log(`   ✅ UPDATE log was created!\n`);
        } else {
          console.log(`   ⚠️  UPDATE log was NOT created\n`);
        }
      } catch (updateError) {
        console.error(`❌ Failed to update patient: ${updateError.response?.data?.message || updateError.message}\n`);
      }
    }
    
    // Step 5: Test VIEW operation
    if (createdPatient) {
      console.log('👁️  Step 5: Testing VIEW operation (get patient)...');
      const beforeViewLogs = await prisma.patientAccessLog.count({
        where: { 
          patientId: createdPatient.id,
          userId: testUser.id,
          accessType: AccessType.VIEW
        }
      });
      console.log(`   Logs before VIEW: ${beforeViewLogs}`);
      
      try {
        const viewResponse = await axios.get(
          `${API_BASE_URL}/patients/${createdPatient.id}`,
          { headers }
        );
        
        console.log(`✅ Patient retrieved: ${viewResponse.data.firstName} ${viewResponse.data.lastName}`);
        
        // Wait for logging to complete
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const afterViewLogs = await prisma.patientAccessLog.count({
          where: { 
            patientId: createdPatient.id,
            userId: testUser.id,
            accessType: AccessType.VIEW
          }
        });
        console.log(`   Logs after VIEW: ${afterViewLogs}`);
        
        if (afterViewLogs > beforeViewLogs) {
          console.log(`   ✅ VIEW log was created!\n`);
        } else {
          console.log(`   ⚠️  VIEW log was NOT created\n`);
        }
      } catch (viewError) {
        console.error(`❌ Failed to view patient: ${viewError.response?.data?.message || viewError.message}\n`);
      }
    }
    
    // Step 6: Verify all logs
    if (createdPatient) {
      console.log('✅ Step 6: Verifying all logs for created patient...');
      const allLogs = await prisma.patientAccessLog.findMany({
        where: { patientId: createdPatient.id },
        orderBy: { timestamp: 'desc' },
        include: {
          user: {
            select: {
              email: true,
              firstName: true,
              lastName: true
            }
          }
        }
      });
      
      console.log(`\n📊 Found ${allLogs.length} total logs:\n`);
      
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
        logsByType[type].forEach((log, idx) => {
          console.log(`    ${idx + 1}. ${log.timestamp.toISOString()}`);
          console.log(`       User: ${log.user?.email || 'N/A'}`);
          console.log(`       Reason: ${log.reason || 'N/A'}`);
        });
      });
      
      // Verify foreign keys
      console.log('\n🔗 Verifying foreign key relationships...');
      let invalidCount = 0;
      for (const log of allLogs) {
        const user = await prisma.user.findUnique({ where: { id: log.userId } });
        const patient = await prisma.patient.findUnique({ where: { id: log.patientId } });
        if (!user || !patient) {
          invalidCount++;
        }
      }
      
      if (invalidCount === 0) {
        console.log('  ✅ All foreign key relationships are valid\n');
      } else {
        console.log(`  ⚠️  Found ${invalidCount} invalid foreign key relationships\n`);
      }
    }
    
    // Final summary
    console.log('='.repeat(70));
    console.log('📈 Final Summary:');
    if (createdPatient) {
      const summary = await prisma.patientAccessLog.groupBy({
        by: ['accessType'],
        where: { patientId: createdPatient.id },
        _count: { id: true }
      });
      
      summary.forEach(item => {
        console.log(`   ${item.accessType}: ${item._count.id} logs`);
      });
    }
    console.log('='.repeat(70));
    console.log('\n✅ API testing completed!\n');
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testApiAccessLogs();

