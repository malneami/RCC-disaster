# Live Ambulance Tracking System

A comprehensive, reusable live tracking system for ambulances with real-time GPS updates, built with **fully open-source** technologies.

## 🚀 Features

### Core Functionality
- **Real-time GPS Tracking**: Updates ambulance locations every 2 minutes automatically
- **Live Status Monitoring**: Track ambulance status (Available, In Use, Maintenance, Out of Service)
- **Driver Information**: View assigned drivers and their contact details
- **Performance Metrics**: Monitor speed, direction, fuel levels, and more
- **Search & Filter**: Advanced filtering by status, type, driver availability, and search queries

### Map Features
- **OpenStreetMap Integration**: 100% open-source mapping solution
- **Interactive Markers**: Click on ambulances to view detailed information
- **Custom Icons**: Color-coded markers based on ambulance status
- **Movement Indicators**: Visual indicators for moving ambulances
- **Auto-fit Bounds**: Automatically adjust map view to show all ambulances
- **Zoom Controls**: Standard map zoom and navigation controls

### User Interface
- **Real-time Stats**: Live statistics displayed in the legend
- **Auto-refresh Countdown**: Visual countdown timer showing next update
- **Responsive Design**: Works seamlessly on all screen sizes
- **Loading States**: Smooth loading and refetching indicators
- **Error Handling**: Graceful error handling with user feedback

## 📦 Tech Stack

### Open Source Technologies Used
- **Leaflet**: Open-source JavaScript library for interactive maps
- **React-Leaflet**: React components for Leaflet maps
- **OpenStreetMap**: Free, open-source map data and tiles
- **React Query**: For efficient data fetching and caching
- **Material-UI**: Open-source React component library
- **TypeScript**: Type-safe development

## 🏗️ Architecture

### Component Structure

```
LiveTracking/
├── LiveAmbulanceMap.tsx         # Main map component
├── components/
│   ├── AmbulanceMarker.tsx      # Individual ambulance marker with popup
│   ├── MapLegend.tsx            # Status legend with statistics
│   ├── MapControls.tsx          # Map controls (refresh, search, filters)
│   └── MapFilters.tsx           # Advanced filtering panel
├── hooks/
│   └── useAmbulanceTracking.ts  # Custom hook for data fetching and filtering
├── utils/
│   └── mapHelpers.ts            # Utility functions for map operations
├── types/
│   └── index.ts                 # TypeScript type definitions
└── index.ts                     # Main exports
```

## 🔧 Usage

### Basic Usage

```tsx
import { LiveAmbulanceMap } from '../../components/LiveTracking';

function MyComponent() {
  return (
    <LiveAmbulanceMap
      height={600}
      autoRefresh={true}
      refreshInterval={120000} // 2 minutes
      useGPSAPI={true}
    />
  );
}
```

### Advanced Usage with Custom Configuration

```tsx
import { LiveAmbulanceMap } from '../../components/LiveTracking';

function AdvancedMap() {
  const handleAmbulanceClick = (ambulance) => {
    console.log('Ambulance clicked:', ambulance);
    // Custom logic here
  };

  return (
    <LiveAmbulanceMap
      height="calc(100vh - 200px)"
      defaultCenter={[24.7136, 46.6753]} // Riyadh, Saudi Arabia
      defaultZoom={12}
      autoRefresh={true}
      refreshInterval={120000} // 2 minutes (120,000 ms)
      useGPSAPI={true}
      showLegend={true}
      showControls={true}
      showFilters={true}
      onAmbulanceClick={handleAmbulanceClick}
    />
  );
}
```

### Using the Hook Independently

```tsx
import { useAmbulanceTracking } from '../../components/LiveTracking';

function CustomComponent() {
  const {
    ambulances,
    isLoading,
    isRefetching,
    lastUpdateTime,
    secondsUntilRefresh,
    refresh,
    stats,
  } = useAmbulanceTracking({
    autoRefresh: true,
    refreshInterval: 120000,
    useGPSAPI: true,
    filters: {
      status: ['AVAILABLE', 'IN_USE'],
      type: ['ADVANCED'],
    },
  });

  return (
    <div>
      <h2>Available Ambulances: {stats.available}</h2>
      <button onClick={refresh}>Refresh Now</button>
      {/* Custom UI here */}
    </div>
  );
}
```

## 🎨 Props Reference

### LiveAmbulanceMap Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `height` | `number \| string` | `600` | Height of the map container |
| `defaultCenter` | `[number, number]` | `[24.7136, 46.6753]` | Default map center [lat, lng] |
| `defaultZoom` | `number` | `12` | Default zoom level |
| `autoRefresh` | `boolean` | `true` | Enable automatic data refresh |
| `refreshInterval` | `number` | `120000` | Refresh interval in milliseconds (default: 2 minutes) |
| `useGPSAPI` | `boolean` | `true` | Use external GPS API or database data |
| `showLegend` | `boolean` | `true` | Show map legend with statistics |
| `showControls` | `boolean` | `true` | Show map controls |
| `showFilters` | `boolean` | `true` | Enable filter panel |
| `onAmbulanceClick` | `(ambulance) => void` | `undefined` | Callback when ambulance marker is clicked |

## 🔄 Auto-Refresh System

The system automatically refreshes ambulance locations every 2 minutes by default:

1. **Countdown Timer**: Visual countdown shows time until next refresh
2. **Background Updates**: Data fetches in the background without disrupting the UI
3. **Manual Refresh**: Users can trigger immediate refresh using the refresh button
4. **Configurable Interval**: Easily adjust refresh rate via `refreshInterval` prop

```tsx
// Refresh every 1 minute
<LiveAmbulanceMap refreshInterval={60000} />

// Refresh every 5 minutes
<LiveAmbulanceMap refreshInterval={300000} />

// Disable auto-refresh
<LiveAmbulanceMap autoRefresh={false} />
```

## 🎯 Data Sources

The system supports two data sources:

### 1. External GPS API (Recommended)
- Real-time GPS data from external tracking devices
- More accurate and up-to-date locations
- Includes speed, direction, and movement data

```tsx
<LiveAmbulanceMap useGPSAPI={true} />
```

### 2. Database Records
- Fallback to database-stored locations
- Used when GPS API is unavailable
- Based on last reported positions

```tsx
<LiveAmbulanceMap useGPSAPI={false} />
```

## 🎨 Customization

### Status Colors

The system uses color-coding for ambulance statuses:

- **Green** (#4caf50): Available
- **Blue** (#2196f3): In Use
- **Orange** (#ff9800): Maintenance
- **Red** (#f44336): Out of Service

### Custom Markers

Markers can be customized via the `mapHelpers.ts` utility:

```typescript
export const createMarkerHTML = (ambulance, isSelected) => {
  // Custom marker HTML here
};
```

## 🔍 Filtering & Search

### Available Filters

1. **Status Filter**: Filter by ambulance status
2. **Type Filter**: Filter by ambulance type (Basic, Advanced, Critical Care)
3. **Driver Filter**: Show only ambulances with/without drivers
4. **Search**: Search by call sign, plate number, IMEI, or driver name

### Filter Example

```tsx
const filters = {
  status: ['AVAILABLE', 'IN_USE'],
  type: ['ADVANCED'],
  hasDriver: true,
  searchQuery: 'A-001',
};
```

## 📊 Statistics

The system provides real-time statistics:

- Total ambulances being tracked
- Count by status (Available, In Use, Maintenance, Out of Service)
- Ambulances with/without drivers
- Moving vs. stationary vehicles

## 🚨 Error Handling

The component handles various error scenarios:

1. **API Failures**: Graceful fallback with error messages
2. **No Data**: Empty state with helpful instructions
3. **Network Issues**: Automatic retry with react-query
4. **Invalid Coordinates**: Filters out invalid location data

## 🌍 OpenStreetMap Attribution

This system uses OpenStreetMap tiles which are free and open-source. The attribution is automatically included in the map as required by OSM's license.

## 📝 Integration Example

### In EMS Portal

```tsx
import { LiveAmbulanceMap } from '../../components/LiveTracking';

const EMSPortal = () => {
  const tabs = [
    {
      label: 'Live Tracking',
      icon: <MapIcon />,
      content: (
        <LiveAmbulanceMap
          height="calc(100vh - 250px)"
          autoRefresh={true}
          refreshInterval={120000}
          useGPSAPI={true}
        />
      ),
    },
    // ... other tabs
  ];

  return <TabsComponent tabs={tabs} />;
};
```

## 🔐 API Requirements

The component expects the following API endpoints:

1. **GET `/ambulances/gps`**: Fetch GPS data from external API
   - Returns: `{ status: boolean, data: GPSObject[] }`

2. **GET `/ambulances`**: Fetch ambulances from database
   - Returns: `Ambulance[]`

## 🧪 Testing

To test the live tracking system:

1. Navigate to EMS Portal → Live Tracking tab
2. Verify ambulances appear on the map
3. Click on markers to view details
4. Test search and filter functionality
5. Observe auto-refresh countdown
6. Manually trigger refresh

## 🚀 Performance

- **React Query Caching**: Efficient data caching and background updates
- **Memoized Calculations**: Optimized filtering and calculations
- **Lazy Loading**: Components load only when needed
- **Debounced Search**: Prevents excessive re-renders

## 🛠️ Maintenance

### Updating Refresh Interval

```tsx
// In EMSPortal.tsx or wherever LiveAmbulanceMap is used
<LiveAmbulanceMap refreshInterval={120000} /> // 2 minutes
```

### Changing Default Map Center

```tsx
// For different regions
<LiveAmbulanceMap 
  defaultCenter={[21.4225, 39.8262]} // Jeddah
  defaultZoom={11}
/>
```

## 📄 License

This component uses fully open-source technologies:
- Leaflet: BSD 2-Clause License
- OpenStreetMap: ODbL License
- React: MIT License

## 🤝 Contributing

When making changes to this component:

1. Maintain backward compatibility
2. Update TypeScript types
3. Test with both GPS API and database modes
4. Ensure responsive design
5. Update this README if needed

## 📞 Support

For issues or questions:
1. Check the browser console for errors
2. Verify API endpoints are accessible
3. Ensure ambulance data has valid coordinates
4. Check network connectivity

