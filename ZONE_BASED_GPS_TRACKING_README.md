# Zone-Based GPS Tracking System

This document describes the zone-based GPS tracking system that automatically updates EMS assignment statuses based on ambulance location and zone boundaries.

## Overview

The zone-based GPS tracking system integrates with the existing GPS monitoring infrastructure to automatically update EMS assignment statuses when ambulances enter or exit specific zones. This provides real-time status updates without manual intervention.

## System Architecture

### Core Components

1. **Zone API Service** (`ZoneApiService`)
   - Fetches zone data from external API
   - Caches zone data for performance
   - Provides zone lookup functions

2. **Zone-Based GPS Monitoring Service** (`ZoneBasedGpsMonitoringService`)
   - Processes GPS location updates
   - Checks zone boundaries
   - Automatically updates EMS assignment statuses
   - Creates timeline events and activity logs

3. **Enhanced GPS Polling Service** (`GpsPollingService`)
   - Integrates zone-based monitoring with existing GPS polling
   - Processes location updates every minute
   - Applies automatic status updates

## Zone-Based Status Mapping

The system automatically updates EMS assignment statuses based on ambulance location relative to zone boundaries:

### Status Flow

```
ASSIGNED/EMS_CONTACT → EN_ROUTE → AT_PICKUP → PATIENT_LOADED → EN_ROUTE → EMS_ARRIVAL → ARRIVED
```

### Zone-Based Triggers

| Current Status | Zone Entry/Exit | New Status | Description |
|---------------|-----------------|------------|-------------|
| `ASSIGNED`/`EMS_CONTACT` | Enters origin zone | `AT_PICKUP` | Ambulance arrived at pickup location |
| `ASSIGNED`/`EMS_CONTACT` | Not in origin zone | `EN_ROUTE` | Ambulance en route to pickup |
| `EN_ROUTE` | Enters origin zone | `AT_PICKUP` | Ambulance reached pickup location |
| `AT_PICKUP` | Exits origin zone (with patient) | `EN_ROUTE` | Ambulance departed with patient |
| `AT_PICKUP` | In origin zone (patient loaded) | `PATIENT_LOADED` | Patient loaded, ready to depart |
| `PATIENT_LOADED` | Exits origin zone | `EN_ROUTE` | Ambulance en route to destination |
| `DEPARTED` | Enters destination zone | `EMS_ARRIVAL` | Ambulance arrived at destination |

## API Configuration

The system uses the following zone API configuration:

```json
{
  "api_key": "7798AA377F99763506758557AC7741A1",
  "service": "get_zone",
  "zone_id": "*"
}
```

## Implementation Details

### 1. Zone API Service

**Location**: `apps/backend/src/common/services/zone-api.service.ts`

**Key Features**:
- Fetches zone data from external API
- Implements 5-minute caching
- Handles API failures gracefully
- Provides zone lookup functions

**Key Methods**:
```typescript
async getAllZones(): Promise<ZoneData[]>
async findZonesContainingPoint(lat: number, lng: number): Promise<ZoneData[]>
clearCache(): void
```

### 2. Zone-Based GPS Monitoring Service

**Location**: `apps/backend/src/common/services/zone-based-gps-monitoring.service.ts`

**Key Features**:
- Processes GPS location updates
- Determines zone-based status changes
- Updates EMS assignments automatically
- Creates comprehensive activity logs

**Key Methods**:
```typescript
async processGpsLocationUpdate(ambulanceId: string, gpsLocation: VehicleStatus): Promise<ZoneStatusUpdate[]>
async getAssignmentZoneStatus(assignmentId: string): Promise<ZoneStatusInfo>
```

### 3. Enhanced GPS Polling Service

**Location**: `apps/backend/src/common/services/gps-polling.service.ts`

**Integration**:
- Calls zone-based monitoring after GPS data processing
- Logs zone-based status updates
- Maintains existing GPS functionality

## API Endpoints

### Zone Management

#### Get All Zones
```http
GET /gps/zones
```
Returns all zones from the external API.

#### Find Zones Containing Point
```http
GET /gps/zones/containing/{lat}/{lng}
```
Finds zones containing specific coordinates.

#### Clear Zone Cache
```http
POST /gps/zones/clear-cache
```
Clears the zone data cache.

### Assignment Zone Status

#### Get Assignment Zone Status
```http
GET /gps/assignment/{assignmentId}/zone-status
```
Returns zone-based status information for an assignment.

**Response**:
```json
{
  "assignment": { /* assignment data */ },
  "currentZone": {
    "zone_id": "ZONE_001",
    "zone_name": "Central District",
    "bounding_box": { /* bounding box data */ },
    "center": { /* center coordinates */ }
  },
  "originZone": { /* origin hospital zone */ },
  "destinationZone": { /* destination hospital zone */ },
  "isInOriginZone": true,
  "isInDestinationZone": false,
  "nextExpectedStatus": "AT_PICKUP"
}
```

#### Process Location Update (Testing)
```http
POST /gps/assignment/{assignmentId}/process-location
```

**Request Body**:
```json
{
  "latitude": 21.4858,
  "longitude": 39.1925
}
```

Processes a GPS location update and returns any zone-based status changes.

## Automatic Status Updates

### How It Works

1. **GPS Polling**: Every minute, the system polls all active ambulances for GPS data
2. **Zone Detection**: For each GPS update, the system checks which zones contain the ambulance location
3. **Status Evaluation**: The system determines if the ambulance's current zone should trigger a status change
4. **Automatic Update**: If a status change is needed, the system automatically updates the EMS assignment
5. **Logging**: All changes are logged with comprehensive metadata

### Status Update Logic

```typescript
// Example logic for status determination
private determineNewStatus(
  currentStatus: AssignmentStatus,
  isInOriginZone: boolean,
  isInDestinationZone: boolean,
  assignment: any
): AssignmentStatus | null {
  switch (currentStatus) {
    case 'ASSIGNED':
    case 'EMS_CONTACT':
      if (isInOriginZone) return 'AT_PICKUP';
      if (!isInOriginZone && !isInDestinationZone) return 'EN_ROUTE';
      break;
    
    case 'EN_ROUTE':
      if (isInOriginZone) return 'AT_PICKUP';
      break;
    
    // ... additional cases
  }
  return null;
}
```

### Timeline Events

The system automatically creates timeline events for each status change:

- **Event Types**: `AMBULANCE_ARRIVED`, `EMS_TRANSPORT_START`, `STATUS_CHANGE`
- **Event Descriptions**: Descriptive text explaining the zone-based status change
- **GPS Coordinates**: Zone center coordinates for mapping
- **Metadata**: Complete zone information and trigger details

### Activity Logs

Each status update creates an activity log entry with:

- **Type**: `TICKET_UPDATED`
- **Description**: Status change details
- **Metadata**: Zone information, previous/new status, trigger type

## Configuration

### Environment Variables

Add these to your `.env` file:

```env
# Zone API Configuration
ZONE_API_KEY=7798AA377F99763506758557AC7741A1
ZONE_API_URL=https://your-zone-api-endpoint.com

# GPS Polling Configuration
GPS_POLLING_INTERVAL=60000  # 1 minute (default)
```

### GPS Polling Schedule

The system polls for GPS data every minute using a cron job:

```typescript
@Cron('0 */1 * * * *') // Every minute
async cronPolling() {
  if (this.isPolling) {
    await this.pollAllVehicles();
  }
}
```

## Usage Examples

### 1. Monitor Assignment Zone Status

```javascript
// Get current zone status for an assignment
const response = await fetch('/gps/assignment/assignment-uuid/zone-status', {
  headers: { 'Authorization': 'Bearer your-jwt-token' }
});

const status = await response.json();
console.log(`Ambulance is in origin zone: ${status.isInOriginZone}`);
console.log(`Next expected status: ${status.nextExpectedStatus}`);
```

### 2. Test Zone-Based Status Updates

```javascript
// Simulate ambulance movement to test zone-based updates
const response = await fetch('/gps/assignment/assignment-uuid/process-location', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your-jwt-token'
  },
  body: JSON.stringify({
    latitude: 21.4858,
    longitude: 39.1925
  })
});

const updates = await response.json();
console.log(`Status updates applied: ${updates.length}`);
```

### 3. Check Zone Coverage

```javascript
// Find zones containing hospital coordinates
const response = await fetch('/gps/zones/containing/21.4858/39.1925', {
  headers: { 'Authorization': 'Bearer your-jwt-token' }
});

const zones = await response.json();
console.log(`Hospital is in ${zones.length} zones:`);
zones.forEach(zone => {
  console.log(`- ${zone.zone_name} (${zone.zone_id})`);
});
```

## Error Handling

The system includes comprehensive error handling:

1. **API Failures**: Falls back to cached zone data
2. **Missing GPS Data**: Skips processing, logs warning
3. **Invalid Coordinates**: Validates GPS data before processing
4. **Database Errors**: Logs errors, continues processing other ambulances
5. **Zone API Unavailable**: Uses cached data, logs warning

## Performance Considerations

1. **Caching**: Zone data is cached for 5 minutes to reduce API calls
2. **Batch Processing**: Multiple ambulances processed in parallel
3. **Selective Processing**: Only processes ambulances with active assignments
4. **Optimized Queries**: Database queries optimized for performance
5. **Background Processing**: GPS polling runs in background, doesn't block requests

## Monitoring and Logging

### Logs Generated

1. **GPS Polling Logs**: Vehicle processing status
2. **Zone Status Updates**: Status changes with zone information
3. **API Call Logs**: Zone API requests and responses
4. **Error Logs**: Failed operations with detailed error information

### Key Metrics

- Number of zone-based status updates per hour
- Zone API response times and success rates
- GPS polling success rates
- Status update accuracy

## Integration with Existing System

The zone-based GPS tracking integrates seamlessly with the existing EMS system:

1. **Existing GPS Infrastructure**: Uses current GPS API service and polling
2. **Database Compatibility**: Works with existing EMS assignment and ticket models
3. **WebSocket Updates**: Status changes are broadcast via existing WebSocket system
4. **Activity Logging**: Integrates with existing activity and timeline systems
5. **Role-Based Access**: Uses existing authentication and authorization

## Testing

### Manual Testing

Use the testing endpoints to simulate ambulance movement:

```bash
# Test zone-based status update
curl -X POST http://localhost:3000/gps/assignment/{assignmentId}/process-location \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{"latitude": 21.4858, "longitude": 39.1925}'
```

### Automated Testing

The system can be tested by:
1. Creating test assignments
2. Simulating GPS movement through zones
3. Verifying automatic status updates
4. Checking timeline events and activity logs

## Troubleshooting

### Common Issues

1. **No Zone Updates**: Check if hospital coordinates are properly set
2. **Status Not Updating**: Verify zone boundaries and GPS accuracy
3. **API Errors**: Check zone API configuration and connectivity
4. **Cache Issues**: Clear zone cache if data seems stale

### Debug Mode

Enable debug logging to see detailed zone processing:

```typescript
// In your logging configuration
Logger.overrideLogger(['log', 'error', 'warn', 'debug', 'verbose']);
```

This will show:
- Zone boundary checks
- Status determination logic
- GPS processing steps
- API call details

## Future Enhancements

Potential improvements:

1. **Machine Learning**: Predict optimal routes based on historical data
2. **Real-time Traffic**: Integrate traffic data for more accurate ETA
3. **Dynamic Zones**: Support for time-based or condition-based zones
4. **Multi-Zone Support**: Handle complex zone overlaps
5. **Predictive Analytics**: Predict ambulance availability and demand

