#!/bin/bash

echo "=== RESTARTING BACKEND AND TESTING ACCESS LOGS ==="

# Find backend process
BACKEND_PID=$(ps aux | grep -i "node.*backend\|nest.*start" | grep -v grep | awk '{print $2}' | head -1)

if [ -z "$BACKEND_PID" ]; then
    echo "No backend process found. Starting backend..."
    cd "$(dirname "$0")/.."
    npm run dev > /tmp/backend.log 2>&1 &
    NEW_PID=$!
    echo "Backend started with PID: $NEW_PID"
    echo "Waiting 10 seconds for backend to start..."
    sleep 10
else
    echo "Found backend process: $BACKEND_PID"
    echo "Killing backend process..."
    kill $BACKEND_PID
    sleep 2
    
    echo "Starting backend..."
    cd "$(dirname "$0")/.."
    npm run dev > /tmp/backend.log 2>&1 &
    NEW_PID=$!
    echo "Backend started with PID: $NEW_PID"
    echo "Waiting 10 seconds for backend to start..."
    sleep 10
fi

echo ""
echo "=== TESTING ACCESS LOGS ENDPOINT ==="
cd "$(dirname "$0")/../.."

node -e "
const axios = require('axios');

(async () => {
  try {
    console.log('1. Logging in...');
    const login = await axios.post('http://localhost:3001/api/v1/auth/login', {
      email: 'admin@rcc-healthcare.com',
      password: 'Healthcare@2024'
    });
    const token = login.data.accessToken;
    console.log('   ✓ Login successful');
    
    console.log('\\n2. Testing access-logs endpoint...');
    const response = await axios.get('http://localhost:3001/api/v1/patients/access-logs?limit=5', {
      headers: { Authorization: 'Bearer ' + token },
      validateStatus: () => true
    });
    
    console.log('   Status:', response.status);
    console.log('   Response type:', typeof response.data);
    
    if (typeof response.data === 'object' && response.data !== null) {
      console.log('   ✓ SUCCESS! Got JSON response');
      console.log('   Total logs:', response.data.total);
      console.log('   Data length:', response.data.data?.length);
      if (response.data.data && response.data.data.length > 0) {
        console.log('   First log ID:', response.data.data[0].id);
        console.log('   First log timestamp:', response.data.data[0].timestamp);
      }
      process.exit(0);
    } else {
      console.log('   ✗ FAILED: Response is not JSON');
      console.log('   Response:', JSON.stringify(response.data));
      process.exit(1);
    }
  } catch (error) {
    console.error('   ✗ ERROR:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
    process.exit(1);
  }
})();
"

echo ""
echo "Backend logs are in /tmp/backend.log"
echo "To view logs: tail -f /tmp/backend.log"

