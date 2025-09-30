# Zone-Based EMS Assignment Testing System

This document describes the comprehensive testing system for zone-based EMS assignment updates, including automated simulation and manual testing capabilities.

## Overview

The zone-based testing system provides multiple approaches to test the automatic EMS assignment status updates based on ambulance location and zone boundaries. It simulates realistic ambulance movement patterns and verifies that status updates occur correctly.

## Testing Approaches

### 1. Automated Testing Simulation (Recommended)

The automated testing simulation automatically moves an ambulance through a predefined route and verifies status updates every minute.

#### Features:
- **6-Step Journey**: Simulates complete ambulance journey from base to origin hospital to destination
- **Automatic Execution**: Runs every minute via cron job
- **Real-time Monitoring**: Track progress and status changes
- **Comprehensive Logging**: All steps logged with detailed metadata

#### Journey Steps:
1. **At Base/Starting Position** → `ASSIGNED`
2. **En Route to Origin Hospital** → `EN_ROUTE`
3. **Arrived at Origin Hospital** → `AT_PICKUP`
4. **Patient Loaded, Departing Origin** → `EN_ROUTE`
5. **En Route to Destination** → `EN_ROUTE`
6. **Arrived at Destination Hospital** → `EMS_ARRIVAL`

**Note**: The system uses only **4 main EMS assignment statuses**:
- `ASSIGNED` - Initial status when assignment is created
- `EN_ROUTE` - Ambulance is moving (to pickup or destination)
- `AT_PICKUP` - Ambulance has arrived at origin hospital zone
- `EMS_ARRIVAL` - Ambulance has arrived at destination hospital zone

### 2. Manual Testing

Manual testing allows you to execute simulation steps on demand for more controlled testing.

### 3. Zone Lookup Testing

Test zone detection functionality with specific coordinates.

## API Endpoints

### Testing Simulation Endpoints

#### Start Testing Simulation
```http
POST /gps/testing/start/{assignmentId}
```

**Description**: Starts automated testing simulation for an EMS assignment.

**Response**:
```json
{
  "id": "test-assignment-uuid-1234567890",
  "name": "Zone Test for Assignment assignment-uuid",
  "assignmentId": "assignment-uuid",
  "ambulanceId": "ambulance-uuid",
  "originZone": {
    "latitude": 21.4858,
    "longitude": 39.1925,
    "zoneId": "ZONE_001"
  },
  "destinationZone": {
    "latitude": 21.5000,
    "longitude": 39.2000,
    "zoneId": "ZONE_002"
  },
  "currentStep": 0,
  "totalSteps": 6,
  "isActive": true,
  "createdAt": "2024-01-15T10:30:00Z",
  "lastUpdate": "2024-01-15T10:30:00Z"
}
```

#### Get Active Scenarios
```http
GET /gps/testing/scenarios
```

**Description**: Returns all currently active testing scenarios.

#### Get Scenario Status
```http
GET /gps/testing/scenarios/{scenarioId}
```

**Description**: Returns detailed status of a specific testing scenario.

**Response**:
```json
{
  "scenario": {
    "id": "test-assignment-uuid-1234567890",
    "currentStep": 2,
    "totalSteps": 6,
    "isActive": true
  },
  "currentStep": {
    "step": 2,
    "name": "Arrived at Origin Hospital",
    "description": "Ambulance entered origin hospital zone",
    "coordinates": {
      "latitude": 21.4858,
      "longitude": 39.1925
    },
    "expectedStatus": "AT_PICKUP",
    "expectedZone": "origin"
  },
  "nextStep": {
    "step": 3,
    "name": "Patient Loaded, Departing Origin",
    "description": "Ambulance leaving origin hospital with patient",
    "coordinates": {
      "latitude": 21.4863,
      "longitude": 39.1930
    },
    "expectedStatus": "EN_ROUTE",
    "expectedZone": "none"
  },
  "assignmentStatus": {
    "id": "assignment-uuid",
    "status": "AT_PICKUP",
    "ambulanceId": "ambulance-uuid",
    "ticketId": "ticket-uuid"
  }
}
```

#### Stop All Simulations
```http
POST /gps/testing/stop-all
```

**Description**: Stops all active testing simulations.

#### Manual Step Execution
```http
POST /gps/testing/assignment/{assignmentId}/simulate-step
```

**Description**: Manually executes the next step in a testing simulation.

**Response**:
```json
{
  "message": "Simulation step executed manually",
  "scenario": { /* scenario data */ },
  "executedStep": {
    "step": 3,
    "name": "Patient Loaded, Departing Origin",
    "description": "Ambulance leaving origin hospital with patient",
    "coordinates": {
      "latitude": 21.4863,
      "longitude": 39.1930
    },
    "expectedStatus": "EN_ROUTE",
    "expectedZone": "none"
  },
  "statusUpdates": [
    {
      "assignmentId": "assignment-uuid",
      "ticketId": "ticket-uuid",
      "ambulanceId": "ambulance-uuid",
      "newStatus": "EN_ROUTE",
      "previousStatus": "AT_PICKUP",
      "zoneInfo": {
        "currentZone": null,
        "originZone": { /* zone data */ },
        "destinationZone": { /* zone data */ },
        "isInOriginZone": false,
        "isInDestinationZone": false
      },
      "timestamp": "2024-01-15T10:35:00Z",
      "triggeredBy": "zone_exit"
    }
  ],
  "timestamp": "2024-01-15T10:35:00Z"
}
```

## Testing Script Usage

### Automated Testing

Run the complete automated testing suite:

```bash
# Install dependencies
npm install axios

# Run automated testing
node test-zone-based-ems-assignment.js

# Or explicitly specify automated mode
node test-zone-based-ems-assignment.js automated
```

### Manual Testing

Execute simulation steps manually for more control:

```bash
# Manual testing with specific assignment ID
node test-zone-based-ems-assignment.js manual assignment-uuid-here
```

### Zone Lookup Testing

Test zone detection functionality:

```bash
node test-zone-based-ems-assignment.js zones
```

## Configuration

### Environment Setup

1. **Update the testing script** with your backend URL and JWT token:
   ```javascript
   const BASE_URL = 'http://localhost:3000'; // Your backend URL
   const API_TOKEN = 'your-jwt-token-here'; // Your JWT token
   ```

2. **Ensure zone API is configured**:
   ```env
   ZONE_API_KEY=7798AA377F99763506758557AC7741A1
   ZONE_API_URL=https://your-zone-api-endpoint.com
   ```

3. **Have an active EMS assignment** ready for testing.

### Prerequisites

- Backend server running
- Valid JWT token with appropriate permissions
- At least one active EMS assignment
- Zone API accessible and returning zone data
- Hospital coordinates properly set in database

## Testing Workflow

### 1. Prepare for Testing

```bash
# 1. Create an EMS assignment (if not exists)
curl -X POST http://localhost:3000/ems-assignments \
  -H "Authorization: Bearer your-token" \
  -H "Content-Type: application/json" \
  -d '{
    "ticketId": "ticket-uuid",
    "ambulanceId": "ambulance-uuid",
    "driverId": "driver-uuid",
    "status": "ASSIGNED"
  }'

# 2. Verify zones are available
curl -X GET http://localhost:3000/gps/zones \
  -H "Authorization: Bearer your-token"
```

### 2. Start Automated Testing

```bash
# Start testing simulation
curl -X POST http://localhost:3000/gps/testing/start/assignment-uuid \
  -H "Authorization: Bearer your-token"

# Monitor progress
curl -X GET http://localhost:3000/gps/testing/scenarios \
  -H "Authorization: Bearer your-token"
```

### 3. Verify Results

```bash
# Check assignment status
curl -X GET http://localhost:3000/ems-assignments/assignment-uuid \
  -H "Authorization: Bearer your-token"

# Check zone status
curl -X GET http://localhost:3000/gps/assignment/assignment-uuid/zone-status \
  -H "Authorization: Bearer your-token"
```

## Expected Behavior

### Status Update Flow (4 Main Statuses)

1. **Initial State**: `ASSIGNED` - Assignment created, ambulance at base
2. **En Route to Origin**: `EN_ROUTE` - Ambulance moving towards origin hospital
3. **At Origin Hospital**: `AT_PICKUP` - Ambulance entered origin hospital zone
4. **En Route to Destination**: `EN_ROUTE` - Ambulance left origin, heading to destination
5. **At Destination**: `EMS_ARRIVAL` - Ambulance entered destination hospital zone

### Timeline Events Created

Each status update creates:
- **Activity Log**: Detailed metadata about the zone-based update
- **Timeline Event**: EMS timeline event with zone information
- **Status Metadata**: Zone details and trigger information

### Database Updates

- **EMS Assignment**: Status and timestamps updated
- **Ticket**: EMS assignment status synchronized
- **Activity Log**: Zone-based update logged
- **Timeline Event**: EMS event created

## Monitoring and Debugging

### Real-time Monitoring

```bash
# Watch simulation progress
watch -n 30 'curl -s -H "Authorization: Bearer your-token" \
  http://localhost:3000/gps/testing/scenarios | jq'
```

### Log Analysis

Check application logs for:
- Zone-based status updates
- GPS location processing
- Zone boundary detection
- Status transition validation

### Common Issues

1. **No Status Updates**: Check if hospital coordinates are set
2. **Wrong Zone Detection**: Verify zone boundaries in API response
3. **Simulation Not Starting**: Ensure assignment exists and is active
4. **API Errors**: Check zone API configuration and connectivity

## Advanced Testing

### Custom Coordinates Testing

Test with specific coordinates:

```javascript
// In the testing script, modify testCoordinates array
const testCoordinates = [
  { lat: 21.4858, lng: 39.1925, name: 'Your Hospital Location' },
  { lat: 21.5000, lng: 39.2000, name: 'Test Point 1' },
  // Add more test points
];
```

### Multiple Assignment Testing

Test multiple assignments simultaneously:

```bash
# Start multiple simulations
curl -X POST http://localhost:3000/gps/testing/start/assignment-1 \
  -H "Authorization: Bearer your-token"

curl -X POST http://localhost:3000/gps/testing/start/assignment-2 \
  -H "Authorization: Bearer your-token"

# Monitor all scenarios
curl -X GET http://localhost:3000/gps/testing/scenarios \
  -H "Authorization: Bearer your-token"
```

### Performance Testing

Monitor system performance during testing:

```bash
# Check GPS polling status
curl -X GET http://localhost:3000/gps/polling/status \
  -H "Authorization: Bearer your-token"

# Check zone API performance
curl -X GET http://localhost:3000/gps/zones \
  -H "Authorization: Bearer your-token" \
  -w "Time: %{time_total}s\n"
```

## Integration with CI/CD

### Automated Testing in Pipeline

```yaml
# Example GitHub Actions workflow
name: Zone-Based EMS Testing
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm install
      - name: Start backend
        run: npm run start:dev &
      - name: Wait for backend
        run: sleep 30
      - name: Run zone-based testing
        run: node test-zone-based-ems-assignment.js
        env:
          API_TOKEN: ${{ secrets.TEST_API_TOKEN }}
```

## Best Practices

1. **Test Environment**: Always use a dedicated test environment
2. **Data Cleanup**: Clean up test data after testing
3. **Monitoring**: Monitor system resources during testing
4. **Documentation**: Document any custom test scenarios
5. **Validation**: Verify both positive and negative test cases

## Troubleshooting

### Common Error Messages

- **"Assignment not found"**: Ensure assignment ID is correct and exists
- **"No zones found"**: Check zone API configuration and hospital coordinates
- **"GPS location not available"**: Verify ambulance has valid GPS data
- **"Zone API returned error"**: Check zone API connectivity and API key

### Debug Mode

Enable debug logging in your backend:

```typescript
// In your logging configuration
Logger.overrideLogger(['log', 'error', 'warn', 'debug', 'verbose']);
```

This will provide detailed information about:
- Zone boundary calculations
- GPS location processing
- Status determination logic
- API call details

## Support

For issues or questions about the zone-based testing system:

1. Check the application logs for detailed error messages
2. Verify all prerequisites are met
3. Test zone API connectivity independently
4. Validate hospital coordinates in database
5. Review zone boundary data from API response
