# Stroke Command Center Dashboard

A comprehensive real-time monitoring dashboard for stroke care analytics and performance tracking.

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
   - Total Stroke Cases, Cases This Month
   - Coverage Rate, Stroke Performance
   - Door-to-Physician, Door-to-CT, Door-to-CT Report
   - Door-to-Needle, Door-to-Mechanical Thrombectomy
   - Stroke Unit Admission

4. **Visual Analytics & Charts**
   - Age Distribution (Donut Chart)
   - Gender Distribution (Donut Chart)
   - Mode of Arrival (Donut Chart)
   - Thrombolytic Therapy Performance (Donut Chart)
   - Swallowing Screening Performance (Donut Chart)
   - Stroke Unit Admission Performance (Card)
   - Follow-Up Outcomes Performance (Card)
   - Stroke Type Distribution (Bar Chart)
   - Performance Trend (Line Chart with Daily/Weekly/Monthly filters)

5. **Traffic Light System**
   - Animated compliance indicators for all stroke KPIs
   - Color-coded performance status (Red/Yellow/Green)
   - Real-time status updates
   - Target achievement tracking

## File Structure

```
CommandCenterDashboard/
├── index.tsx                           # Main dashboard component
├── types.ts                            # TypeScript interfaces
├── components/
│   ├── LiveClock.tsx                   # Real-time clock display
│   ├── StrokeKPICards.tsx             # 4 main KPI cards
│   ├── StrokeDistributionCharts.tsx   # 3 donut charts (age, gender, mode)
│   ├── TherapyPerformanceCharts.tsx   # 2 performance donut charts
│   ├── AdmissionFollowupCharts.tsx    # Stroke unit & follow-up cards
│   ├── StrokeTypeDistribution.tsx     # Stroke type bar chart
│   ├── PerformanceTrendChart.tsx      # Performance trend line chart
│   ├── StrokeTrafficLightSystem.tsx   # Compliance indicators
│   └── ExportDialog.tsx              # Export functionality
├── hooks/
│   └── useStrokeCommandCenterData.ts # Data management hook
└── api/
    └── commandCenterService.ts       # API service
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
<Route path="/stroke/command-center" component={CommandCenterDashboard} />
```

## KPIs Tracked

### Time-based KPIs (Lower is Better)
- **Door to Physician**: Target ≤10 minutes
- **Door to CT**: Target ≤25 minutes  
- **Door to CT Report**: Target ≤45 minutes
- **Door to Needle**: Target ≤60 minutes
- **Door to Mechanical Thrombectomy**: Target ≤120 minutes

### Performance-based KPIs (Higher is Better)
- **Stroke Unit Admission**: Target ≥80%
- **Thrombolytic Therapy**: Target ≥5%
- **Swallowing Screening**: Target ≥85%

### Traffic Light Status
- 🟢 **Excellent** (90.0%+): Target achieved with excellence
- 🟡 **Good** (75.0-89.9%): Near target, acceptable performance
- 🔴 **Needs Improvement** (<75.0%): Below target, requires attention

## Future Enhancements

1. **Chart Implementation**
   - Integrate Chart.js for actual chart rendering
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
