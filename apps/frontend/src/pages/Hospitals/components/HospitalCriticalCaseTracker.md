# Hospital Critical Case Tracker Integration

This document describes the integration of the Real-Time Critical Case Tracker into the hospital dashboard's critical cases tab.

## Overview

The Hospital Critical Case Tracker provides hospital-specific monitoring of STEMI and Stroke cases with live countdown timers, progress visualization, and audio alerts. It's integrated into the hospital dashboard's critical cases tab to provide real-time tracking of incoming critical cases.

## Components

### HospitalCriticalCaseTracker
A hospital-specific version of the critical case tracker that filters cases for the specific hospital.

**Features:**
- Hospital-specific case filtering
- Real-time countdown timers for STEMI (120 min) and Stroke (4.5 hr)
- Progress visualization with color-coded warnings
- Audio alerts with voice notifications
- Error handling with retry functionality
- Summary statistics for active cases

### useHospitalCriticalCases Hook
Custom hook that fetches critical cases specific to a hospital.

**Features:**
- Hospital-specific data fetching
- Real-time updates every 30 seconds
- Error handling with mock data fallback
- Automatic retry logic with exponential backoff

## Backend Integration

### API Endpoints
The component connects to the following backend endpoints:

1. **Transfer Tickets for Hospital**
   ```
   GET /tickets?destinationHospitalId={hospitalId}
   ```
   Fetches all transfer tickets where the hospital is the destination.

2. **Critical Cases for Hospital**
   ```
   GET /tickets/critical-cases?hospitalId={hospitalId}
   ```
   Fetches STEMI and Stroke cases specific to the hospital.

### Data Flow
1. Component mounts with hospital ID
2. Hook fetches transfer tickets for the hospital
3. Filters for STEMI and Stroke cases only
4. Transforms data to unified interface
5. Updates every 30 seconds for real-time monitoring
6. Triggers audio alerts for critical cases

## Integration Points

### Hospital Dashboard Integration
The tracker is integrated into the hospital dashboard's critical cases tab:

```tsx
{/* Critical Cases Tab */}
{tabValue === 0 && (
  <Box sx={{ p: 3 }}>
    {/* Real-Time Critical Case Tracker */}
    <Box sx={{ mb: 4 }}>
      <HospitalCriticalCaseTracker hospitalId={hospitalId!} />
    </Box>

    {/* Traditional Critical Cases List */}
    <Typography variant="h6" gutterBottom>
      All Critical Cases ({criticalCases.length})
    </Typography>
    {/* ... existing critical cases list ... */}
  </Box>
)}
```

### Service Layer Updates
Added new method to hospital service:

```typescript
async getCriticalCasesForHospital(hospitalId: string): Promise<any[]> {
  try {
    const response = await apiClient.get(`/tickets/critical-cases?hospitalId=${hospitalId}`);
    return response.data?.data || response.data || [];
  } catch (error) {
    console.error('Error fetching critical cases for hospital:', error);
    return [];
  }
}
```

## Features

### Real-Time Monitoring
- **Live Updates**: Data refreshes every 30 seconds
- **Countdown Timers**: Real-time countdown for each case
- **Progress Visualization**: Color-coded progress bars
- **Critical Warnings**: Visual and audio alerts

### Audio Alert System
- **Warning Sounds**: Triple beep pattern for critical alerts
- **Voice Notifications**: "STEMI Emergency!" or "Stroke Emergency!"
- **Browser Notifications**: Fallback notifications
- **Cooldown Management**: 1-minute intervals between alerts

### Visual Indicators
- **Color-Coded Progress**: Green → Orange → Red based on time elapsed
- **Critical State**: Red borders and backgrounds for urgent cases
- **Pathway Icons**: Heart for STEMI, Brain for Stroke
- **Status Chips**: Priority and status indicators

## Data Structure

```typescript
interface HospitalCriticalCase {
  id: string;
  ticketNumber: string;
  pathway: 'STEMI' | 'STROKE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'EMERGENCY';
  status: 'PENDING' | 'ASSIGNED' | 'IN_TRANSPORT' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
  patient: {
    firstName: string;
    lastName: string;
    mrn?: string;
  };
  originHospital: {
    name: string;
  };
  destinationHospital?: {
    name: string;
  };
  chiefComplaint: string;
  estimatedArrival?: string;
  // ... additional fields
}
```

## Time Limits and Alerts

- **STEMI Cases**: 120 minutes (2 hours) from ticket creation
- **Stroke Cases**: 4.5 hours from ticket creation
- **Critical Warning**: Triggered when <10 minutes remaining
- **Audio Alerts**: Played every minute when in critical state

## Error Handling

The component includes comprehensive error handling:

1. **API Errors**: Graceful fallback to mock data
2. **Network Issues**: Retry logic with exponential backoff
3. **Audio Failures**: Multiple fallback options
4. **Permission Denied**: Graceful degradation

## Usage

```tsx
import HospitalCriticalCaseTracker from './components/HospitalCriticalCaseTracker';

// In HospitalDashboardPage
<HospitalCriticalCaseTracker hospitalId={hospitalId!} />
```

## Benefits

1. **Hospital-Specific Monitoring**: Focuses on cases relevant to the specific hospital
2. **Real-Time Awareness**: Immediate visibility of critical incoming cases
3. **Audio Alerts**: Ensures critical cases don't go unnoticed
4. **Progress Tracking**: Visual representation of time-sensitive cases
5. **Integrated Workflow**: Seamlessly integrated into existing hospital dashboard

## Future Enhancements

- WebSocket integration for real-time updates
- Push notifications for mobile devices
- Integration with hospital notification systems
- Advanced filtering and sorting options
- Export functionality for case reports
- Integration with hospital bed management systems
