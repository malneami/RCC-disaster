# Hospital Management Module

A comprehensive hospital management system for tracking resources and capacity in real-time for the RCC Healthcare Platform.

## Features

### Core Functionality
- **Hospital CRUD Operations**: Create, read, update, and delete hospitals with comprehensive validation
- **Real-time Capacity Tracking**: Monitor bed availability across different types (ICU, PICU, NICU, male/female standard)
- **Resource Availability Dashboard**: Visual representation of hospital capacity with charts and metrics
- **Automated Alerts**: System alerts for low capacity thresholds (warning and critical levels)
- **Bulk Update Capabilities**: Update multiple hospitals' capacity simultaneously
- **Integration Endpoints**: API endpoints for hospital systems integration
- **Historical Capacity Reporting**: Track capacity changes over time with detailed history

### Hospital Entity Features
- **Basic Information**: Name, address, coordinates, contact details
- **Bed Capacity Management**: ICU, PICU, NICU, male/female standard beds
- **Equipment Tracking**: Ventilators, monitors, specialized equipment
- **Service Capabilities**: Cardiology, stroke unit, trauma center levels
- **Status Management**: Available, limited, critical, offline
- **Update Mechanisms**: Manual, API, scheduled sync

## Backend Architecture

### Database Schema
The enhanced hospital management system includes:

```sql
-- Enhanced Hospital table with capacity tracking
CREATE TABLE hospitals (
  id UUID PRIMARY KEY,
  name VARCHAR NOT NULL,
  code VARCHAR UNIQUE NOT NULL,
  address VARCHAR NOT NULL,
  city VARCHAR NOT NULL,
  state VARCHAR NOT NULL,
  zip_code VARCHAR NOT NULL,
  phone_number VARCHAR NOT NULL,
  email VARCHAR,
  website VARCHAR,
  type hospital_type NOT NULL,
  status hospital_status DEFAULT 'AVAILABLE',
  update_mechanism update_mechanism DEFAULT 'MANUAL',
  latitude DECIMAL,
  longitude DECIMAL,
  
  -- Bed capacity fields
  total_beds INTEGER DEFAULT 0,
  available_beds INTEGER DEFAULT 0,
  icu_beds INTEGER DEFAULT 0,
  icu_available INTEGER DEFAULT 0,
  picu_beds INTEGER DEFAULT 0,
  picu_available INTEGER DEFAULT 0,
  nicu_beds INTEGER DEFAULT 0,
  nicu_available INTEGER DEFAULT 0,
  male_beds INTEGER DEFAULT 0,
  male_available INTEGER DEFAULT 0,
  female_beds INTEGER DEFAULT 0,
  female_available INTEGER DEFAULT 0,
  
  -- Medical capabilities
  has_emergency_dept BOOLEAN DEFAULT true,
  has_cath_lab BOOLEAN DEFAULT false,
  has_stroke_center BOOLEAN DEFAULT false,
  has_trauma_center BOOLEAN DEFAULT false,
  trauma_level INTEGER,
  
  -- Alert thresholds
  critical_threshold INTEGER DEFAULT 10,
  warning_threshold INTEGER DEFAULT 25,
  
  -- Timestamps
  last_capacity_update TIMESTAMP,
  last_api_sync TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

-- Hospital capacity history
CREATE TABLE hospital_capacity_history (
  id UUID PRIMARY KEY,
  hospital_id UUID REFERENCES hospitals(id),
  timestamp TIMESTAMP DEFAULT NOW(),
  total_beds INTEGER,
  available_beds INTEGER,
  icu_beds INTEGER,
  icu_available INTEGER,
  picu_beds INTEGER,
  picu_available INTEGER,
  nicu_beds INTEGER,
  nicu_available INTEGER,
  male_beds INTEGER,
  male_available INTEGER,
  female_beds INTEGER,
  female_available INTEGER,
  update_source VARCHAR,
  updated_by VARCHAR
);

-- Hospital beds
CREATE TABLE hospital_beds (
  id UUID PRIMARY KEY,
  hospital_id UUID REFERENCES hospitals(id),
  bed_number VARCHAR NOT NULL,
  type bed_type NOT NULL,
  is_occupied BOOLEAN DEFAULT false,
  is_available BOOLEAN DEFAULT true,
  is_operational BOOLEAN DEFAULT true,
  location VARCHAR,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(hospital_id, bed_number)
);

-- Hospital equipment
CREATE TABLE hospital_equipment (
  id UUID PRIMARY KEY,
  hospital_id UUID REFERENCES hospitals(id),
  name VARCHAR NOT NULL,
  type equipment_type NOT NULL,
  model VARCHAR,
  serial_number VARCHAR,
  is_operational BOOLEAN DEFAULT true,
  is_available BOOLEAN DEFAULT true,
  last_maintenance TIMESTAMP,
  next_maintenance TIMESTAMP,
  location VARCHAR,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### API Endpoints

#### Hospital Management
- `POST /api/v1/hospitals` - Create a new hospital
- `GET /api/v1/hospitals` - Get all hospitals with optional filters
- `GET /api/v1/hospitals/:id` - Get hospital by ID
- `PUT /api/v1/hospitals/:id` - Update hospital
- `DELETE /api/v1/hospitals/:id` - Delete hospital (soft delete)

#### Capacity Management
- `PUT /api/v1/hospitals/:id/capacity` - Update hospital capacity
- `GET /api/v1/hospitals/:id/capacity-history` - Get capacity history
- `POST /api/v1/hospitals/bulk/capacity` - Bulk update capacity

#### Alerts
- `GET /api/v1/hospitals/alerts` - Get capacity alerts

#### Bed Management
- `POST /api/v1/hospitals/:id/beds` - Add a bed to hospital

#### Equipment Management
- `POST /api/v1/hospitals/:id/equipment` - Add equipment to hospital

### WebSocket Events

The system includes real-time WebSocket communication for live updates:

- `join-hospital-room` - Join a specific hospital's update room
- `leave-hospital-room` - Leave a hospital's update room
- `subscribe-to-alerts` - Subscribe to capacity alerts
- `unsubscribe-from-alerts` - Unsubscribe from alerts

#### Emitted Events
- `capacity-updated` - When hospital capacity is updated
- `capacity-alert` - When capacity alerts are triggered
- `hospital-status-changed` - When hospital status changes

## Frontend Components

### Main Dashboard
- **Hospital Overview**: Grid view of all hospitals with capacity status
- **Capacity Dashboard**: Detailed charts and metrics for selected hospital
- **Map View**: Geographic representation of hospital network
- **Alerts Panel**: Real-time capacity alerts

### Interactive Components
- **Hospital Capacity Chart**: Multi-tabbed chart component with:
  - Current capacity overview
  - Availability percentage visualization
  - Historical trends (30-day view)
  - Detailed bed type breakdown
  - Capacity history table

- **Hospital Map**: Interactive map showing hospital locations with:
  - Color-coded markers based on capacity status
  - Tooltips with hospital information
  - Legend for status indicators

### Dialog Components
- **Create Hospital Dialog**: Comprehensive form for adding new hospitals
- **Update Capacity Dialog**: Real-time capacity update interface
- **Alert Dialog**: Detailed view of capacity alerts

## Usage Examples

### Creating a Hospital
```typescript
const hospitalData = {
  name: "City General Hospital",
  code: "CGH001",
  address: "123 Main Street",
  city: "Springfield",
  state: "IL",
  zipCode: "62701",
  phoneNumber: "217-555-0123",
  email: "info@citygeneral.com",
  type: "TERTIARY",
  totalBeds: 500,
  availableBeds: 450,
  icuBeds: 50,
  icuAvailable: 45,
  criticalThreshold: 10,
  warningThreshold: 25
};

await hospitalService.createHospital(hospitalData);
```

### Updating Capacity
```typescript
const capacityUpdate = {
  availableBeds: 400,
  icuAvailable: 40,
  updateMechanism: "MANUAL",
  updatedBy: "user123"
};

await hospitalService.updateHospitalCapacity(hospitalId, capacityUpdate);
```

### Real-time Updates
```typescript
// Connect to WebSocket
const socket = io('http://localhost:3001/hospitals', {
  auth: {
    token: localStorage.getItem('accessToken')
  }
});

// Join hospital room
socket.emit('join-hospital-room', { hospitalId: 'hospital-123' });

// Listen for capacity updates
socket.on('capacity-updated', (data) => {
  console.log('Capacity updated:', data);
});

// Listen for alerts
socket.on('capacity-alert', (alert) => {
  console.log('Alert received:', alert);
});
```

## Configuration

### Environment Variables
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/rcc_healthcare"

# JWT
JWT_SECRET="your-secret-key"

# Frontend URL for CORS
FRONTEND_URL="http://localhost:5173"

# Server
PORT=3001
HOST=0.0.0.0
NODE_ENV=development
```

### Alert Thresholds
- **Critical Threshold**: Default 10% - Triggers critical alerts
- **Warning Threshold**: Default 25% - Triggers warning alerts

## Security Features

- **JWT Authentication**: All endpoints require valid JWT tokens
- **Role-based Access**: Different permissions for different user roles
- **Input Validation**: Comprehensive validation using class-validator
- **CORS Protection**: Configured CORS for secure cross-origin requests
- **WebSocket Authentication**: WebSocket connections require JWT authentication

## Monitoring and Alerts

The system provides comprehensive monitoring capabilities:

1. **Real-time Capacity Monitoring**: Track bed availability across all hospital types
2. **Automated Alerts**: System automatically detects when hospitals fall below thresholds
3. **Historical Tracking**: Maintain detailed history of all capacity changes
4. **Audit Trail**: Track who made changes and when
5. **Performance Metrics**: Monitor system performance and response times

## Future Enhancements

- **Advanced Analytics**: Machine learning for capacity prediction
- **Mobile App**: Native mobile application for field updates
- **Integration APIs**: Standardized APIs for hospital system integration
- **Advanced Mapping**: Integration with mapping services for better visualization
- **Notification System**: Email/SMS notifications for critical alerts
- **Reporting Engine**: Advanced reporting and export capabilities
