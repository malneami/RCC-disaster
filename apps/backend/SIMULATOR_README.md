# Continuous GPS Simulator

A realistic GPS simulator for testing the ambulance tracking system. Runs continuously alongside the backend to provide live GPS updates.

## Features

- **Realistic Movement**: Ambulances move between origin and destination hospitals
- **State Transitions**: Simulates complete trip cycles (at_origin → to_destination → at_destination → returning)
- **Configurable**: Adjust update intervals and movement speed
- **Graceful Shutdown**: Handles Ctrl+C and SIGTERM signals cleanly
- **Logging**: Provides real-time status updates

## Usage

### Start the Simulator

```bash
# In a separate terminal from the backend
npx ts-node apps/backend/continuous-simulator.ts
```

### Stop the Simulator

Press `Ctrl+C` to gracefully shut down the simulator.

## Configuration

Edit `continuous-simulator.ts` to adjust:

- `UPDATE_INTERVAL_MS`: Time between GPS updates (default: 10 seconds)
- `MOVEMENT_SPEED`: How fast ambulances move (default: 0.001 degrees ≈ 100m per update)

## How It Works

1. **Initialization**: Loads ambulances from database (SIM-OLD-CASE, SIM-EARLIER-CASE, SIM-NOW-CASE)
2. **Movement Loop**: Every 10 seconds:
   - Updates each ambulance's position based on current state
   - Sends GPS update to backend API
   - Logs activity (reduced noise - only 1 in 6 updates logged)
3. **State Machine**:
   - `at_origin`: Waiting at origin hospital
   - `to_destination`: Moving towards destination
   - `at_destination`: Arrived at destination (waits 30s)
   - `returning`: Moving back to origin (waits 20s at origin before next trip)

## Viewing Results

### Live Tracking Map
1. Open the EMS portal
2. Navigate to "Live Tracking"
3. The map will show ambulances at their latest database positions
4. Refresh to see updated positions

### Zone Hits
1. Go to "EMS Assignments"
2. Find assignments for TICKET-OLD, TICKET-EARLIER, or TICKET-NOW
3. Click the three-dot menu on an assignment card
4. Select "View Ambulance Hits"
5. See timeline of hospital zone entries/exits

### Database Verification

```bash
# Check GPS tracking logs
npx ts-node apps/backend/check-logs.ts

# Or query directly
psql -d your_database -c "SELECT * FROM gps_tracking_logs ORDER BY timestamp DESC LIMIT 20;"
```

## Troubleshooting

### "Backend not running" Error
- Make sure the backend server is running on port 3001
- Check that the API endpoint is accessible: `http://localhost:3001/api/v1/ambulance-tracking/location`

### No Ambulances Loaded
- Run the seed script first: `npx ts-node apps/backend/seed-verification-data.ts`
- Verify ambulances exist in database

### Map Not Updating
- The map uses a 2-minute refresh interval by default
- Click the "Refresh" button to force an update
- Check browser console for errors
- Verify the backend sync endpoint is working: `POST /api/v1/ambulance-tracking/sync`

## Technical Details

### API Endpoint
```
POST /api/v1/ambulance-tracking/location
Body: {
  ambulanceId: string,
  latitude: number,
  longitude: number,
  timestamp: string (ISO 8601),
  speed: number,
  direction: number,
  accuracy: number
}
```

### Database Tables
- `gps_tracking_logs`: 20-minute rolling window of GPS positions
- `ambulance_zone_logs`: Hospital zone entry/exit events
- `ambulances`: Current ambulance state and metadata

## Next Steps

After running the simulator:
1. Verify zone logs are being created: `npx ts-node apps/backend/check-logs.ts`
2. Check the Live Tracking map shows moving ambulances
3. View zone hits in the EMS portal
4. Test the complete workflow with all 3 test cases
