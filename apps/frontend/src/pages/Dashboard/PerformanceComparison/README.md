# Performance Comparison Dashboard

This feature provides a comprehensive performance comparison dashboard that matches the design shown in the provided image. It displays performance metrics across different time periods with interactive charts and analysis.

## Structure

```
PerformanceComparison/
├── index.tsx              # Main component with header, time selection, and layout
├── DailySummary.tsx        # Progress bars for current/previous/average periods
├── ChangeAnalysis.tsx      # Comparison cards with trend indicators
├── PerformanceChart.tsx    # Line chart for pathway data visualization
├── api.ts                 # API service and mock data generation
├── hooks.ts               # React Query hook for data management
└── README.md             # This documentation file
```

## Features

### Time Period Selection
- **Daily**: Shows hourly data for the last 24 hours
- **Weekly**: Shows daily data for the last 7 days  
- **Monthly**: Shows daily data for the last 30 days

### Global Metrics Display
- Current case count
- Percentage change vs previous period
- Percentage change vs average

### Daily Summary Section
- Progress bars for Current Period, Previous Period, and Average
- Color-coded bars (Green, Blue, Purple)
- Real-time value display

### Change Analysis Section
- Comparison cards showing percentage changes
- Trend indicators (up/down/stable)
- Visual icons for trend direction

### Performance Chart
- Multi-line chart showing pathway data
- Four data series: STEMI (red), Stroke (green), Trauma (orange), Other (purple)
- Interactive tooltips and legend
- Responsive design

## Data Structure

```typescript
interface PerformanceComparisonData {
  globalMetrics: {
    current: number;
    previousChange: number;
    averageChange: number;
  };
  dailySummary: {
    currentPeriod: number;
    previousPeriod: number;
    average: number;
  };
  changeAnalysis: {
    vsPreviousPeriod: number;
    vsAverage: number;
    trend: 'up' | 'down' | 'stable';
  };
  chartData: {
    data: Array<{
      date: string;
      stemi: number;
      stroke: number;
      trauma: number;
      other: number;
    }>;
  };
}
```

## Usage

```tsx
import PerformanceComparison from './PerformanceComparison';

// In your component
<PerformanceComparison />
```

## API Integration

The component uses React Query for data fetching with:
- 5-minute cache duration
- Automatic refetching every 5 minutes
- Retry logic with exponential backoff
- Fallback to mock data when API is unavailable

## Styling

- Follows the existing Material-UI theme
- Dark theme compatible
- Responsive design for all screen sizes
- Consistent with the overall dashboard design

## Dependencies

- `@mui/material` - UI components
- `@fortawesome/react-fontawesome` - Icons
- `recharts` - Chart visualization
- `react-query` - Data fetching and caching
- `axios` - HTTP client (via apiClient)

## Future Enhancements

- Real-time data updates via WebSocket
- Export functionality for reports
- Custom date range selection
- Additional chart types (bar, pie, etc.)
- Performance alerts and notifications
