# Hospital Components - Ticket Integration

This directory contains components for managing hospital-related tickets, including both internal hospital tickets and incoming transfer tickets.

## New Components

### RelatedTicketsManager
A comprehensive ticket management component that unifies both hospital tickets and transfer tickets into a single, searchable, and filterable interface.

**Features:**
- Unified view of hospital tickets and transfer tickets
- Advanced filtering by status, priority, type, and pathway
- Multiple sorting options (date, priority, status)
- Search functionality across ticket content
- Grid and list view modes
- Real-time statistics and counts
- Action buttons for viewing and editing tickets

**Props:**
```typescript
interface RelatedTicketsManagerProps {
  hospitalTickets: HospitalTicket[];
  transferTickets: Ticket[];
  hospitalId: string;
  onRefresh?: () => void;
  onViewTicket?: (ticket: UnifiedTicket) => void;
  onEditTicket?: (ticket: UnifiedTicket) => void;
  isLoading?: boolean;
}
```

### TicketCard
A reusable card component for displaying ticket information in a consistent format.

**Features:**
- Unified display for both ticket types
- Color-coded priority and status indicators
- Patient information display (for transfer tickets)
- Hospital and location information
- Action buttons for view/edit operations
- Responsive design with hover effects

**Props:**
```typescript
interface TicketCardProps {
  ticket: UnifiedTicket;
  onView?: (ticket: UnifiedTicket) => void;
  onEdit?: (ticket: UnifiedTicket) => void;
  showActions?: boolean;
}
```

## Types

### UnifiedTicket
A unified interface that combines both hospital tickets and transfer tickets into a single data structure.

```typescript
interface UnifiedTicket {
  id: string;
  type: 'TRANSFER' | 'HOSPITAL';
  title: string;
  description: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  // ... additional fields for both ticket types
}
```

### TicketFilterOptions
Configuration for filtering tickets by various criteria.

```typescript
interface TicketFilterOptions {
  status?: string[];
  priority?: string[];
  type?: string[];
  pathway?: string[];
  search?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}
```

## Integration

The RelatedTicketsManager is integrated into the HospitalDashboardPage as a replacement for the previous Related Tickets tab. It provides:

1. **Unified Data Management**: Combines hospital tickets and transfer tickets into a single interface
2. **Enhanced User Experience**: Advanced filtering, sorting, and search capabilities
3. **Consistent Design**: Uses Material-UI components with consistent styling
4. **Action Integration**: Seamless navigation to ticket details and editing

## Usage

```tsx
import RelatedTicketsManager from './components/RelatedTicketsManager';

// In HospitalDashboardPage
<RelatedTicketsManager
  hospitalTickets={relatedTickets}
  transferTickets={transferTickets}
  hospitalId={hospitalId!}
  onRefresh={loadHospitalData}
  onViewTicket={handleViewTicket}
  onEditTicket={handleEditTicket}
  isLoading={loading}
/>
```

## Benefits

1. **Improved Efficiency**: Hospital staff can now manage all tickets from a single interface
2. **Better Organization**: Advanced filtering helps staff focus on relevant tickets
3. **Enhanced Visibility**: Clear visual distinction between ticket types
4. **Streamlined Workflow**: Direct access to ticket actions and details
5. **Real-time Updates**: Statistics and counts update automatically

## Future Enhancements

- Real-time WebSocket updates for live ticket status changes
- Bulk operations for multiple tickets
- Custom ticket views and layouts
- Integration with notification system
- Export functionality for ticket reports
- Advanced analytics and reporting
