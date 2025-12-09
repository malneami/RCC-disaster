import axios from 'axios';

const API_URL = 'http://localhost:3001/api/v1/ambulances/gps';

async function testGPSEndpoint() {
  console.log('🧪 Testing /api/v1/ambulances/gps endpoint...\n');

  try {
    const response = await axios.get(API_URL, {
      timeout: 10000,
      validateStatus: () => true // Accept any status
    });

    console.log(`Status: ${response.status}`);
    
    if (response.status === 401) {
      console.log('⚠️  Endpoint requires authentication (expected for production)');
      console.log('   This is normal - frontend will use authenticated requests');
      return;
    }

    if (response.status !== 200) {
      console.log(`❌ Unexpected status: ${response.status}`);
      console.log(response.data);
      return;
    }

    const data = response.data;
    
    if (!data.status || !data.data) {
      console.log('❌ Invalid response format');
      console.log(JSON.stringify(data, null, 2));
      return;
    }

    console.log(`✅ Endpoint responding correctly`);
    console.log(`   Total ambulances: ${data.data.length}`);
    
    // Check data freshness
    const now = new Date();
    let freshCount = 0;
    let staleCount = 0;
    
    data.data.forEach((amb: any) => {
      if (amb.timestamp) {
        const timestamp = new Date(amb.timestamp);
        const ageMinutes = (now.getTime() - timestamp.getTime()) / 60000;
        
        if (ageMinutes <= 20) {
          freshCount++;
        } else {
          staleCount++;
        }
      }
    });
    
    console.log(`   Fresh data (<20m): ${freshCount}`);
    console.log(`   Stale data (>20m): ${staleCount}`);
    
    // Show sample
    if (data.data.length > 0) {
      const sample = data.data[0];
      console.log('\n📦 Sample ambulance:');
      console.log(`   Call Sign: ${sample.callSign}`);
      console.log(`   Location: ${sample.lat}, ${sample.lng}`);
      console.log(`   Speed: ${sample.speed}`);
      console.log(`   Timestamp: ${sample.timestamp}`);
    }
    
  } catch (error: any) {
    console.error(`❌ Error: ${error.message}`);
  }
}

testGPSEndpoint();
