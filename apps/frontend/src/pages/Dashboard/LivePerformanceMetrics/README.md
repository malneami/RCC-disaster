# Live Performance Metrics

This component displays real-time system performance indicators in a clean, organized card layout. It shows key metrics that are critical for monitoring the current state of the healthcare system.

## Structure

```
LivePerformanceMetrics/
├── index.tsx              # Main component with metrics display
├── api.ts                 # API service and mock data
├── hooks.ts               # React Query hook for data management
└── README.md             # This documentation file
```

## Features

### Real-time Metrics Display
- **Active Transports**: Current number of active transport cases
- **Average Response Time**: Average response time in minutes (highlighted in green)
- **Hospital Capacity**: Current hospital capacity percentage with progress bar
- **Ambulance Utilization**: Ambulance utilization percentage with progress bar
- **Completed Today**: Number of completed cases today

### Visual Elements
- Clock icon in header for "live" indication
- Color-coded metrics (blue, green, orange)
- Progress bars for capacity and utilization metrics
- Secondary icons for additional context (truck + calendar for transports)

## Data Structure

```typescript
interface LivePerformanceMetricsData {
  activeTransports: number;
  avgResponseTime: number;
  hospitalCapacity: number;
  ambulanceUtilization: number;
  completedToday: number;
}
```

## Usage

```tsx
import LivePerformanceMetrics from './LivePerformanceMetrics';

// In your component
<LivePerformanceMetrics />
```

## API Integration

The component uses React Query for data fetching with:
- 30-second cache duration (for live data)
- Automatic refetching every 30 seconds
- Retry logic with exponential backoff
- Fallback to mock data when API is unavailable

## Styling

- Follows Material-UI design system
- Consistent with dashboard theme
- Responsive design for all screen sizes
- Clean card layout with proper spacing

## Dependencies

- `@mui/material` - UI components
- `@fortawesome/react-fontawesome` - Icons
- `react-query` - Data fetching and caching
- `axios` - HTTP client (via apiClient)

## Future Enhancements

- Real-time WebSocket updates
- Alert notifications for critical thresholds
- Historical trend indicators
- Custom refresh intervals
