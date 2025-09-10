# Critical Case Tracker

A real-time critical case tracking system that monitors STEMI and Stroke cases with live countdown timers, progress visualization, and audio alerts.

## Structure

```
CriticalCaseTracker/
├── index.tsx                    # Main tracker component
├── CriticalCaseCard.tsx         # Individual case card component
├── useAudioAlerts.ts           # Audio alert hook
├── api.ts                      # API service for critical cases
├── hooks.ts                    # React Query hooks
└── README.md                   # This documentation file
```

## Features

### Real-Time Tracking
- **Live Countdown**: Real-time countdown for STEMI (120 min) and Stroke (4.5 hr) cases
- **Progress Visualization**: Color-coded progress bars showing time elapsed
- **Critical Warnings**: Visual and audio alerts when time is running out

### Audio Alerts System
- **Warning Sounds**: Triple beep pattern for critical alerts
- **Voice Notifications**: Text-to-speech alerts saying "STEMI Emergency" or "Stroke Emergency"
- **Browser Notifications**: Fallback notifications for critical cases
- **Cooldown Period**: 1-minute cooldown between alerts to prevent spam

### Visual Indicators
- **Color-Coded Progress**: Green (normal), Orange (warning), Red (critical)
- **Critical State**: Red border and background for cases with <10 minutes remaining
- **Pathway Icons**: Heart icon for STEMI, Brain icon for Stroke
- **Status Chips**: Priority and status indicators

### Case Information Display
- **Patient Details**: Name, MRN, and basic information
- **Route Information**: Origin and destination hospitals
- **Medical Details**: Chief complaint and estimated arrival time
- **Transport Info**: EMS unit and transport mode

## Components

### CriticalCaseTracker
Main component that displays all active STEMI and Stroke cases.

**Features:**
- Error handling with retry functionality
- Summary statistics for active cases
- Real-time updates every 30 seconds
- Audio alert management

### CriticalCaseCard
Individual card component for each critical case.

**Features:**
- Live countdown timer with second-by-second updates
- Progress bar with color-coded warnings
- Patient and route information
- Action buttons for viewing details
- Critical state highlighting

### useAudioAlerts Hook
Custom hook for managing audio alerts and notifications.

**Features:**
- Web Audio API for warning sounds
- Web Speech API for voice alerts
- Browser notification fallback
- Alert cooldown management

## Data Structure

```typescript
interface CriticalCase {
  id: string;
  ticketNumber: string;
  pathway: 'STEMI' | 'STROKE';
  priority: string;
  status: string;
  createdAt: string;
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

## Time Limits

- **STEMI Cases**: 120 minutes (2 hours) from ticket creation
- **Stroke Cases**: 4.5 hours from ticket creation
- **Critical Warning**: Triggered when <10 minutes remaining
- **Audio Alerts**: Played every minute when in critical state

## Audio Alert System

### Warning Sound Pattern
- Three consecutive beeps at 800Hz frequency
- 0.2-second duration per beep
- 0.3-second intervals between beeps

### Voice Alerts
- "STEMI Emergency! Critical time limit approaching!"
- "Stroke Emergency! Critical time limit approaching!"
- Uses Web Speech API with optimized voice settings

### Fallback Notifications
- Browser notifications (if permission granted)
- Browser alert popup (final fallback)

## API Integration

The component uses React Query for data management:
- **Cache Duration**: 30 seconds for real-time updates
- **Refetch Interval**: 30 seconds for automatic updates
- **Error Handling**: Graceful fallback to mock data
- **Retry Logic**: Exponential backoff for failed requests

## Usage

```tsx
import CriticalCaseTracker from './CriticalCaseTracker';

// In Dashboard component
<CriticalCaseTracker />
```

## Browser Permissions

The component may request the following permissions:
- **Notification Permission**: For browser notifications
- **Audio Context**: For warning sounds (automatically granted)

## Styling

- Follows Material-UI design system
- Consistent with dashboard theme
- Responsive design for all screen sizes
- Critical state highlighting with red accents
- Smooth transitions and hover effects

## Future Enhancements

- WebSocket integration for real-time updates
- Push notifications for mobile devices
- Customizable alert thresholds
- Integration with hospital systems
- Advanced analytics and reporting
- Multi-language voice alerts
