import axios from 'axios';

const GPS_API_URL = 'https://gps3.tawasolmap.com/new_api/';
const GPS_API_KEY = '7798AA377F99763506758557AC7741A1';

async function inspectAPIResponse() {
  console.log('🔍 Inspecting API Response Format...\n');

  try {
    const response = await axios.post(
      GPS_API_URL,
      {
        api_key: GPS_API_KEY,
        service: 'objects',
        imeis: '*'
      },
      {
        timeout: 10000,
        headers: { 'Content-Type': 'application/json' }
      }
    );

    if (response.data.status && response.data.data && response.data.data.length > 0) {
      const sample = response.data.data[0];
      console.log('📦 Sample Vehicle Data:');
      console.log(JSON.stringify(sample, null, 2));
      
      console.log('\n🕐 Timestamp Analysis:');
      console.log(`   Raw timestamp field: "${sample.timestamp || sample.dt_tracker || sample.dt_server}"`);
      console.log(`   Type: ${typeof (sample.timestamp || sample.dt_tracker || sample.dt_server)}`);
      
      // Try parsing
      const rawTime = sample.dt_tracker || sample.dt_server || sample.timestamp;
      console.log(`\n   Attempting to parse: "${rawTime}"`);
      const parsed = new Date(rawTime);
      console.log(`   Parsed Date: ${parsed}`);
      console.log(`   Is Valid: ${!isNaN(parsed.getTime())}`);
      
      if (!isNaN(parsed.getTime())) {
        const ageMinutes = (Date.now() - parsed.getTime()) / 60000;
        console.log(`   Age: ${Math.round(ageMinutes)} minutes`);
      }
    }
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }
}

inspectAPIResponse();
