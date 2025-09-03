# Comprehensive Ticketing System for Patient Transfers

## Overview

This comprehensive ticketing system manages patient transfers between healthcare facilities with real-time tracking, automated notifications, and role-based workflow management.

## Features

### 🏥 Ticket Workflow Management
- **Creation**: Transfer requests with patient and medical requirements
- **Review**: RCC coordinator validation and priority assignment
- **Assignment**: EMS assignment and hospital coordination
- **Transport**: Real-time tracking and status updates
- **Completion**: Arrival confirmation and case closure

### 🎯 Ticket Properties
- Patient information and medical requirements
- Source and destination hospitals
- Priority levels (routine, urgent, critical, emergency)
- Case types (general, STEMI, stroke, trauma)
- Required resources (ICU, ventilator, cardiology)
- Timeline tracking with timestamps
- Status workflow management

### 🔐 Role-Based Access Control
- **ADMIN**: Full system access and ticket management
- **RCC**: Ticket creation, assignment, and coordination
- **EMS**: Transport management and status updates
- **DATA_COLLECTOR**: Ticket creation and basic updates
- **CATH_LAB_USER**: STEMI pathway management

### 📊 Dashboard & Analytics
- Real-time statistics and metrics
- Priority-based ticket distribution
- Pathway analysis and reporting
- Hospital-specific dashboards
- Performance tracking

### 🔔 Real-time Notifications
- WebSocket-based live updates
- Emergency ticket alerts
- Status change notifications
- Transport event notifications
- Assignment confirmations

## Technical Architecture

### Backend (NestJS)
```
src/modules/tickets/
├── dto/
│   ├── create-ticket.dto.ts      # Ticket creation validation
│   ├── update-ticket.dto.ts       # Ticket update validation
│   └── ticket-filter.dto.ts       # Search and filter validation
├── tickets.controller.ts         # REST API endpoints
├── tickets.service.ts            # Business logic and workflow
├── tickets.gateway.ts            # WebSocket real-time updates
└── tickets.module.ts             # Module configuration
```

### Frontend (React + TypeScript)
```
src/pages/Tickets/
├── components/
│   ├── TicketList.tsx            # Ticket display and actions
│   ├── TicketStatisticsCards.tsx # Dashboard metrics
│   ├── TicketFilters.tsx         # Advanced filtering
│   ├── CreateTicketDialog.tsx     # Ticket creation form
│   └── EmergencyNotification.tsx # Emergency alerts
├── TicketsPage.tsx               # Main tickets page
└── services/
    ├── ticketService.ts           # API integration
    └── webSocketService.ts       # Real-time communication
```

## API Endpoints

### Ticket Management
- `POST /tickets` - Create new ticket
- `GET /tickets` - List tickets with filtering
- `GET /tickets/:id` - Get ticket details
- `PUT /tickets/:id` - Update ticket
- `PUT /tickets/:id/status` - Update ticket status
- `PUT /tickets/:id/assign` - Assign ticket to user

### Analytics
- `GET /tickets/statistics` - Get ticket statistics
- `GET /tickets/statistics/priority` - Priority distribution
- `GET /tickets/statistics/pathway` - Pathway analysis

### WebSocket Events
- `ticketUpdated` - Real-time ticket updates
- `emergencyTicket` - Emergency ticket alerts
- `transportStarted` - Transport initiation
- `transportCompleted` - Transport completion
- `ticketAssigned` - Assignment notifications

## Database Schema

### Core Entities
- **Ticket**: Main transfer request entity
- **Patient**: Patient information
- **Hospital**: Healthcare facilities
- **User**: System users with roles
- **Activity**: Audit trail and logging

### Key Relationships
- Tickets are linked to origin and destination hospitals
- Tickets are assigned to users based on roles
- Activities track all ticket operations
- Real-time updates via WebSocket connections

## Priority Calculation Algorithm

The system automatically calculates ticket priority based on:

1. **Emergency Flag**: Immediate emergency priority
2. **Vital Signs**: Critical vitals trigger high priority
3. **Pathway Type**: STEMI/Stroke = Critical, Trauma = High
4. **Specialist Requirements**: Specialist needs = Higher priority

## Status Workflow

### Allowed Transitions by Role
- **ADMIN/RCC**: All status transitions
- **EMS**: Assigned → In Transport → Completed
- **CATH_LAB_USER**: Pending → Assigned → In Transport → Completed
- **DATA_COLLECTOR**: Pending → Assigned

### Status Flow
1. **PENDING**: Initial ticket creation
2. **ASSIGNED**: Assigned to EMS or specialist
3. **IN_TRANSPORT**: Transport in progress
4. **COMPLETED**: Transfer completed
5. **CANCELLED**: Transfer cancelled

## Installation & Setup

### Backend Dependencies
```bash
npm install socket.io @nestjs/websockets @nestjs/platform-socket.io
```

### Frontend Dependencies
```bash
npm install socket.io-client date-fns
```

### Environment Variables
```env
# WebSocket Configuration
FRONTEND_URL=http://localhost:3000
REACT_APP_WS_URL=http://localhost:3001
```

## Usage Examples

### Creating a Ticket
```typescript
const ticketData = {
  patientId: "patient-uuid",
  originHospitalId: "hospital-uuid",
  destinationHospitalId: "destination-uuid",
  priority: "CRITICAL",
  pathway: "STEMI",
  chiefComplaint: "Chest pain with ST elevation",
  isEmergency: true,
  requiresSpecialist: true,
  requiredResources: {
    cardiology: true,
    icu: true
  }
};

await ticketService.createTicket(ticketData);
```

### Real-time Updates
```typescript
// Subscribe to ticket updates
webSocketService.subscribeToTicket(ticketId, (event) => {
  console.log('Ticket updated:', event.ticket);
});

// Listen for emergency tickets
webSocketService.onEmergencyTicket((event) => {
  console.log('Emergency ticket:', event.ticket);
});
```

## Security Features

- JWT-based authentication for all endpoints
- Role-based authorization for ticket operations
- WebSocket authentication with JWT tokens
- Input validation and sanitization
- Audit trail for all operations

## Performance Considerations

- Pagination for large ticket lists
- Efficient database queries with proper indexing
- WebSocket connection pooling
- Real-time updates with minimal bandwidth usage
- Caching for frequently accessed data

## Future Enhancements

- Mobile app integration
- GPS tracking for transport vehicles
- Integration with hospital EMR systems
- Advanced analytics and reporting
- Machine learning for priority prediction
- Multi-language support
- Advanced notification preferences

## Contributing

1. Follow the existing code structure
2. Add proper TypeScript types
3. Include comprehensive error handling
4. Write unit tests for new features
5. Update documentation for API changes

## Support

For technical support or feature requests, please contact the development team or create an issue in the project repository.
