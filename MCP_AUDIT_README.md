# MCP Data Quality Audit System

A comprehensive data quality audit system with Model Context Protocol (MCP) integration for the RCC Healthcare Platform.

## Features

- **6 Audit Dimensions**: Completeness, Accuracy, Consistency, Timeliness, Compliance, Integrity
- **Hybrid Triggers**: Scheduled (daily/weekly/hourly), real-time (on data changes), on-demand (manual)
- **MCP Integration**: External AI-powered analysis via REST API
- **Rich Dashboard**: Overall score, dimension breakdown, severity analysis, recent events
- **Audit Reports**: Paginated list, downloadable (PDF/Excel), detailed dimension scores
- **Event Tracking**: Comprehensive event log with filters and pagination
- **Role-Based Access**: ADMIN, RCC, DATA_COLLECTOR roles

## Setup

### 1. Configure Environment Variables

Add to `apps/backend/.env`:

```env
# MCP Audit Configuration
MCP_AUDIT_ENABLED=true
MCP_AUDIT_SERVER_URL=https://your-mcp-server.com
MCP_AUDIT_API_KEY=your-api-key-here
MCP_AUDIT_TIMEOUT_MS=30000
MCP_AUDIT_RETRY_ATTEMPTS=3
MCP_AUDIT_REALTIME_ENABLED=true
MCP_AUDIT_CRITICAL_EVENTS_ONLY=false
MCP_AUDIT_DAILY_HOUR=3
MCP_AUDIT_WEEKLY_DAY=0
```

### 2. Database Migration

The schema is already in sync. If you need to migrate in the future:

```bash
cd apps/backend
npx prisma migrate dev --name add_mcp_audit_updates
```

### 3. Restart Application

```bash
# From root directory
npm run dev
```

The backend will be available at `https://localhost:3000`  
The frontend will be available at `https://localhost:5173`

## Usage

### Accessing the Audit System

Navigate to the Administration section in the sidebar:

1. **MCP Audit Dashboard** (`/audit/dashboard`)
   - Overall quality score
   - Dimension breakdown (6 cards)
   - Severity analysis
   - Recent events
   - Date range filters

2. **Audit Reports** (`/audit/reports`)
   - List all generated reports
   - Generate new audit (select dimensions, date range)
   - Download reports (PDF/Excel)
   - View report details

3. **Audit Events** (`/audit/events`)
   - View all audit events
   - Filter by date, severity, entity type
   - Check MCP submission status

### API Endpoints

#### Dashboard
```http
GET /api/v1/mcp-audit/dashboard?startDate=2026-01-01&endDate=2026-02-17
```

#### Reports
```http
GET /api/v1/mcp-audit/reports?page=1&pageSize=20
GET /api/v1/mcp-audit/reports/:id
GET /api/v1/mcp-audit/reports/:id/download?format=pdf
```

#### Trigger Audit
```http
POST /api/v1/mcp-audit/audit/trigger
Content-Type: application/json

{
  "dimensions": ["COMPLETENESS", "ACCURACY", "CONSISTENCY", "TIMELINESS", "COMPLIANCE", "INTEGRITY"],
  "startDate": "2026-01-01",
  "endDate": "2026-02-17",
  "hospitalId": "uuid-optional",
  "submitToMcp": true
}
```

#### Events
```http
GET /api/v1/mcp-audit/events?page=1&pageSize=50&severity=ERROR
```

#### Health Check
```http
GET /api/v1/mcp-audit/health
```

## Audit Dimensions

### 1. Completeness
Checks for missing required fields across all entities:
- **Patient**: firstName, lastName, gender, dateOfBirth/age, nationalId (if not flagged as unavailable)
- **Ticket**: patientId, originHospitalId, priority, pathway
- **Disaster**: locationLat, locationLng, casualty estimates
- **Ambulance**: vehicleImei, callSign, plateNumber, currentLocation (if available)
- **Hospital**: name, latitude/longitude
- **OB Maternal**: gestationalAgeWeeks, activationLevel, vital signs
- **Cases (STEMI/Stroke/Trauma)**: Clinical scores, timing fields, outcomes

### 2. Accuracy
Validates data correctness:
- **Dates**: Future dates, dates before 1900
- **Vital Signs**: BP (50-250), HR (20-250), RR (5-60), Temp (30-45), SpO2 (0-100)
- **Clinical Scores**: NIHSS (0-42), GCS (3-15), MRS (0-6)
- **Gestational Age**: 1-45 weeks
- **Coordinates**: Latitude (-90 to 90), Longitude (-180 to 180)

### 3. Consistency
Checks duplicates and cross-references:
- **Patient Duplicates**: By National ID, MRN
- **Orphaned References**: Tickets without patients, assignments without ambulances
- **Status Consistency**: Ambulance status vs assignment status

### 4. Timeliness
Monitors data freshness:
- **Stale GPS Data**: Ambulances not updated in >5 minutes
- **Pending Tickets**: >24 hours old
- **Future Timestamps**: Invalid creation dates
- **Out-of-order Events**: Arrival before assignment

### 5. Compliance
Validates clinical protocols:
- **STEMI**: Door-to-balloon <90 minutes
- **Stroke**: Door-to-needle <60 minutes, CT scan <25 minutes
- **Disaster**: Hospital announcement sent
- **MoH Standards**: Required fields per pathway

### 6. Integrity
Checks referential integrity:
- **Orphaned Records**: Bed requests without patients, cases without patients
- **Broken References**: EMS assignments without tickets
- **Cascade Deletes**: Soft-delete validation

## Scheduled Audits

### Daily Audit
- **Time**: 3:00 AM (configurable via `MCP_AUDIT_DAILY_HOUR`)
- **Scope**: Last 24 hours
- **Dimensions**: All 6
- **MCP Submission**: Enabled

### Weekly Audit
- **Time**: Sundays at midnight (configurable via `MCP_AUDIT_WEEKLY_DAY`)
- **Scope**: Last 7 days
- **Dimensions**: All 6
- **MCP Submission**: Enabled

### Hourly Check
- **Time**: Every hour on the hour
- **Scope**: Timeliness dimension only
- **MCP Submission**: Disabled (logs only)

## Real-time Audit

### Monitored Operations
- **Patient**: CREATE, UPDATE, DELETE
- **Ticket**: CREATE, UPDATE
- **Disaster**: CREATE, UPDATE
- **EMS Assignment**: CREATE
- **Bed Request**: CREATE

### Configuration
- Enable/disable: `MCP_AUDIT_REALTIME_ENABLED`
- Critical only: `MCP_AUDIT_CRITICAL_EVENTS_ONLY` (skips INFO events)

## MCP Integration

### Request Format
```json
{
  "auditId": "uuid",
  "timestamp": "2026-02-17T00:00:00Z",
  "auditType": "SCHEDULED",
  "dimensions": ["COMPLETENESS", "ACCURACY"],
  "filters": {
    "startDate": "2026-02-01",
    "endDate": "2026-02-17",
    "hospitalId": "uuid",
    "entityTypes": ["PATIENT", "TICKET"]
  },
  "data": {
    "COMPLETENESS": {
      "score": 95.5,
      "issues": [
        {
          "entityType": "PATIENT",
          "entityId": "uuid",
          "description": "Missing National ID",
          "severity": "WARNING"
        }
      ]
    }
  }
}
```

### Response Format
```json
{
  "auditId": "uuid",
  "status": "SUCCESS",
  "analysisUrl": "https://mcp-server.com/reports/audit-123",
  "insights": [
    {
      "dimension": "COMPLETENESS",
      "severity": "WARNING",
      "message": "20% of patients missing National ID",
      "recommendation": "Implement validation at registration"
    }
  ],
  "overallScore": 93.5,
  "processedAt": "2026-02-17T00:01:23Z"
}
```

## Troubleshooting

### MCP Server Connection Issues
1. Check `MCP_AUDIT_ENABLED=true` in `.env`
2. Verify `MCP_AUDIT_SERVER_URL` is correct
3. Test connection: `GET /api/v1/mcp-audit/health`
4. Check logs: `apps/backend/logs/`

### No Audit Events
1. Verify `MCP_AUDIT_REALTIME_ENABLED=true`
2. Check interceptor is registered in `AppModule`
3. Ensure operations are on monitored endpoints

### Scheduled Audits Not Running
1. Check `ScheduleModule.forRoot()` in `AppModule`
2. Verify `McpAuditCronService` is in providers
3. Check logs for cron execution

### Dashboard Not Loading
1. Verify backend is running and accessible
2. Check browser console for errors
3. Verify user has required role (ADMIN/RCC/DATA_COLLECTOR)

## Performance Considerations

- **Indexes**: All audit queries use indexed fields (dimension, eventType, createdAt, severity)
- **Pagination**: Default page sizes (20 for reports, 50 for events)
- **Async**: MCP submissions don't block API responses
- **Caching**: Consider adding Redis cache for dashboard data
- **Retention**: Implement audit log cleanup (e.g., archive events >90 days)

## Security

- **Authentication**: JWT required for all endpoints
- **Authorization**: Role-based (ADMIN, RCC, DATA_COLLECTOR)
- **MCP API Key**: Stored in environment variables, never exposed to frontend
- **Data Masking**: Sensitive data (passwords) never included in audit events
- **HTTPS**: All MCP communication over TLS

## Future Enhancements

- [ ] Actual PDF/Excel generation (currently placeholder)
- [ ] Dashboard charts (line, bar, pie)
- [ ] Email notifications for critical issues
- [ ] Trend calculation from historical data
- [ ] Export events to CSV
- [ ] Customizable audit schedules via UI
- [ ] MCP insights integration in dashboard
- [ ] Audit log retention policy
- [ ] Performance metrics (audit execution time)
- [ ] Webhook support for third-party integrations

## Support

For issues or questions:
1. Check logs: `apps/backend/logs/`
2. Review implementation: `MCP_AUDIT_IMPLEMENTATION.md`
3. API documentation: Swagger at `https://localhost:3000/api/docs`

## License

Part of the RCC Healthcare Platform.
