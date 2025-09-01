#!/bin/bash

echo "🏥 Testing Hospital Management Module..."

# Check if backend is running
echo "📡 Checking if backend is running..."
if curl -s http://localhost:3001/api/v1/health > /dev/null 2>&1; then
    echo "✅ Backend is running on port 3001"
else
    echo "❌ Backend is not running on port 3001"
    echo "Please start the backend with: npm run start:dev"
    exit 1
fi

# Test hospitals endpoint
echo "🏥 Testing hospitals endpoint..."
HOSPITALS_RESPONSE=$(curl -s http://localhost:3001/api/v1/hospitals)
if [ $? -eq 0 ]; then
    echo "✅ Hospitals endpoint is working"
    echo "📊 Found $(echo $HOSPITALS_RESPONSE | jq '. | length' 2>/dev/null || echo 'unknown number of') hospitals"
else
    echo "❌ Hospitals endpoint failed"
fi

# Test alerts endpoint
echo "🚨 Testing alerts endpoint..."
ALERTS_RESPONSE=$(curl -s http://localhost:3001/api/v1/hospitals/alerts)
if [ $? -eq 0 ]; then
    echo "✅ Alerts endpoint is working"
    echo "🚨 Found $(echo $ALERTS_RESPONSE | jq '. | length' 2>/dev/null || echo 'unknown number of') alerts"
else
    echo "❌ Alerts endpoint failed"
fi

echo "🎉 Testing completed!"
