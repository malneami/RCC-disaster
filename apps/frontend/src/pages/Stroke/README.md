# Stroke Portal

A comprehensive stroke care coordination system for the RCC Healthcare Platform.

## Overview

The Stroke Portal provides specialized tools for managing stroke cases, tracking performance metrics, and coordinating time-sensitive stroke care protocols.

## Features

### Core Functionality
- **Stroke Case Management**: Create, update, and track stroke cases
- **Clinical Assessments**: NIHSS, mRS, Barthel Index, ASPECTS, GCS scoring
- **Performance Tracking**: Real-time KPI monitoring and reporting
- **Timeline Management**: Detailed event tracking and status progression
- **Treatment Protocols**: Thrombolysis and thrombectomy pathway management

### Key Performance Indicators (KPIs)
1. **Door to CT Scan** ≤ 25 minutes
2. **Door to Needle** ≤ 60 minutes (for thrombolysis)
3. **Door to Mechanical Thrombectomy** ≤ 90 minutes (for thrombectomy)
4. **Stroke Unit Admission** ≤ 4 hours
5. **Dysphagia Screening** ≤ 4 hours
6. **Early Mobilization** ≤ 24 hours
7. **Secondary Prevention Prescribed**
8. **Appropriate Rehabilitation Referral**

## Components

### Main Components
- `StrokePortalPage`: Main portal page with tabs and overview
- `StrokeCasesList`: Table view of all stroke cases with filtering
- `StrokeKPIDashboard`: Performance metrics and KPI tracking
- `StrokeTimelineView`: Timeline visualization for individual cases

### Dialog Components
- `CreateStrokeCaseDialog`: Multi-step form for creating new cases
- `StrokeCaseDetailsDialog`: Detailed view of case information
- `EditStrokeCaseDialog`: Form for updating case details

## Services

### StrokeService
Comprehensive service for stroke-related API operations:
- Case management (CRUD operations)
- Timeline management
- KPI summary retrieval
- Utility functions for labels and formatting

## Configuration

### strokeConfig.ts
Centralized configuration for:
- KPI targets and thresholds
- Stroke types, severities, and statuses
- Assessment types and validation rules
- Performance colors and thresholds

## Utilities

### strokeUtils.ts
Helper functions for:
- Score validation and calculations
- Time formatting and duration calculations
- Color coding and status determination
- Risk factors and contraindications

## Hooks

### useStrokePortal.ts
Custom hook for managing stroke portal state:
- Data loading and caching
- CRUD operations
- Error handling
- Real-time updates

## Usage

```tsx
import StrokePortalPage from './pages/Stroke/StrokePortalPage';

// Use in routing
<Route path="/stroke-portal" component={StrokePortalPage} />
```

## Data Models

### StrokeCase
Comprehensive case model including:
- Patient and hospital information
- Clinical assessments and scores
- Treatment details and outcomes
- Performance timings and KPIs
- Discharge and follow-up information

### StrokeTimeline
Event tracking model for:
- Status changes and transitions
- Timing metrics and targets
- Clinical context and notes
- User actions and triggers

## API Endpoints

### Stroke Cases
- `GET /stroke-cases` - List all cases
- `POST /stroke-cases` - Create new case
- `GET /stroke-cases/:id` - Get case details
- `PATCH /stroke-cases/:id` - Update case
- `DELETE /stroke-cases/:id` - Delete case
- `GET /stroke-cases/kpi-summary` - Get KPI summary

### Stroke Timeline
- `GET /stroke-timeline` - List timeline events
- `POST /stroke-timeline` - Create timeline event
- `GET /stroke-timeline/case/:id` - Get case timeline
- `GET /stroke-timeline/critical-events` - Get critical events

## Performance Considerations

- Real-time KPI calculations
- Optimized data loading with parallel requests
- Efficient filtering and sorting
- Responsive design for mobile devices

## Security

- Role-based access control
- JWT authentication
- Input validation and sanitization
- Audit trail for all actions

## Future Enhancements

- Real-time notifications
- Advanced analytics and reporting
- Integration with CT scan systems
- Mobile app support
- AI-powered risk assessment

