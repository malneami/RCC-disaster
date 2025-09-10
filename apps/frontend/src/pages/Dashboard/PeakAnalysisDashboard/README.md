# Peak Analysis Dashboard

This component provides traffic pattern analysis and trend comparison metrics. It displays case statistics with comparative analysis and identifies peak operational hours.

## Structure

```
PeakAnalysisDashboard/
├── index.tsx              # Main component with analysis display
├── api.ts                 # API service and mock data
├── hooks.ts               # React Query hook for data management
└── README.md             # This documentation file
```

## Features

### Case Analysis Metrics
- **Today's Cases**: Current day case count
- **Yesterday's Cases**: Previous day case count
- **Weekly Average**: Average cases over the past week

### Trend Comparison
- **vs Yesterday**: Percentage change compared to yesterday
- **vs Last Week**: Percentage change compared to last week
- Green upward arrows for positive trends

### Peak Hours Identification
- **Peak Hours**: Time period with highest activity (e.g., "19:00-20:00")
- Highlighted in green in a dedicated section

### Visual Elements
- Chart line icon in header for analysis indication
- Color-coded metrics (blue for counts, green for trends)
- Divider separating case metrics from comparison metrics
- Dark background section for peak hours

## Data Structure

```typescript
interface PeakAnalysisData {
  todaysCases: number;
  yesterdaysCases: number;
  weeklyAverage: number;
  vsYesterday: number;
  vsLastWeek: number;
  peakHours: string;
}
```

## Usage

```tsx
import PeakAnalysisDashboard from './PeakAnalysisDashboard';

// In your component
<PeakAnalysisDashboard />
```

## API Integration

The component uses React Query for data fetching with:
- 5-minute cache duration
- Automatic refetching every 5 minutes
- Retry logic with exponential backoff
- Fallback to mock data when API is unavailable

## Styling

- Follows Material-UI design system
- Consistent with dashboard theme
- Responsive design for all screen sizes
- Clean card layout with proper spacing
- Visual hierarchy with dividers and sections

## Dependencies

- `@mui/material` - UI components
- `@fortawesome/react-fontawesome` - Icons
- `react-query` - Data fetching and caching
- `axios` - HTTP client (via apiClient)

## Future Enhancements

- Interactive trend charts
- Historical peak hour analysis
- Predictive peak hour forecasting
- Custom date range selection
- Export functionality for reports
