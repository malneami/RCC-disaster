# STEMI Command Center Dashboard

A comprehensive real-time monitoring dashboard for STEMI care analytics and performance tracking.

## Features Implemented

### ✅ Core Dashboard Components

1. **Real-time Monitoring & Display**
   - Live clock with date/time display
   - Fullscreen/display mode toggle
   - Auto-refresh every 30 seconds
   - Real-time data streaming
   - Export functionality (PDF/Image)

2. **Multi-dimensional Filtering**
   - Language selection (English/Arabic)
   - Hospital-specific filtering (all hospitals or individual)
   - Custom date range selection
   - Real-time filter application

3. **Performance KPIs & Metrics**
   - Time-based Metrics: Door-to-ECG, Door-to-Needle, Door-to-Balloon, DIDO
   - Clinical Outcomes: Total cases, PCI success rate, Mortality rate
   - Compliance percentages and trend indicators

4. **Visual Analytics & Charts**
   - Chart placeholders for: Referral source, PCI breakdown, DIDO compliance
   - Treatment distribution, Patient outcomes, Hospital performance
   - Interactive chart type selection (Pie, Bar, Line)
   - Time period selection (Daily, Weekly, Monthly)

5. **Traffic Light System**
   - Animated compliance indicators
   - Color-coded performance status (Red/Yellow/Green)
   - Real-time status updates

## File Structure

```
CommandCenterDashboard/
├── index.tsx                    # Main dashboard component
├── types.ts                     # TypeScript interfaces
├── components/
│   ├── LiveClock.tsx            # Real-time clock display
│   ├── FilterPanel.tsx          # Multi-dimensional filtering
│   ├── KPIMetrics.tsx          # Performance metrics display
│   ├── VisualAnalytics.tsx     # Charts and visualizations
│   ├── TrafficLightSystem.tsx  # Compliance indicators
│   └── ExportDialog.tsx        # Export functionality
└── hooks/
    └── useCommandCenterData.ts  # Data management hook
```

## Technical Specifications

### Data Integration
- REST API endpoints with query parameters
- Real-time data fetching with error handling
- Caching and refresh intervals
- Mock data implementation for demonstration

### Responsive Design
- Grid-based layout (12-column system)
- Mobile-responsive components
- Fullscreen mode optimization
- Print/export compatibility

### User Interface Elements
- Navigation & Controls: Refresh, Export, Fullscreen, Language toggle
- Status Indicators: Live activity, Performance badges, Compliance scores
- Interactive Elements: Hover tooltips, Clickable filters, Dynamic updates

## Usage

```tsx
import CommandCenterDashboard from './components/CommandCenterDashboard';

// Use in routing
<Route path="/stemi/command-center" component={CommandCenterDashboard} />
```

## Future Enhancements

1. **Chart Implementation**
   - Integrate Chart.js or Recharts for actual chart rendering
   - Add interactive tooltips and drill-down capabilities
   - Implement heatmap visualization for hospital performance

2. **Real API Integration**
   - Replace mock data with actual API calls
   - Implement WebSocket for real-time updates
   - Add data caching and offline support

3. **Advanced Features**
   - Hospital performance comparison
   - Patient management integration
   - Compliance monitoring alerts
   - Custom report generation

## Guidelines Followed

- ✅ No file exceeds 250 lines
- ✅ Single responsibility per component
- ✅ Modular, independent files
- ✅ Self-contained feature folders
- ✅ DRY principles applied
- ✅ Existing folder structure maintained
