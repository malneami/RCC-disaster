# Bed Management System - Entity & File Documentation

This document explains each entity, schema file, and component in the RCC Bed Management System, their purpose, and how they will be used in future development.

---

## 📋 Table of Contents

1. [Enums](#enums)
2. [Core Entities](#core-entities)
3. [Workflow Entities](#workflow-entities)
4. [Audit & Metrics Entities](#audit--metrics-entities)
5. [Schema Files](#schema-files)
6. [Migration Scripts](#migration-scripts)
7. [Future Implementation Guide](#future-implementation-guide)

---

## Enums

### `BedType` Enum

**Values:**
- `ICU` - Intensive Care Unit beds
- `PICU` - Pediatric Intensive Care Unit beds
- `NICU` - Neonatal Intensive Care Unit beds
- `ED` - Emergency Department beds
- `MALE_WARD` - Male ward beds
- `FEMALE_WARD` - Female ward beds
- `PEDIATRIC_WARD` - Pediatric ward beds
- `STANDARD_WARD` - Standard ward beds
- `STROKE_UNIT` - Stroke unit beds
- `CCU` - Cardiac Care Unit beds
- `OTHER` - Other specialized bed types

**Purpose:** Categorizes bed types across the hospital system. Each bed type represents a different medical unit with specific care requirements.

**Future Use:**
- Filter beds by type in dashboards
- Route bed requests to appropriate units
- Calculate capacity metrics per bed type
- Generate unit-specific reports

---

### `BedStatus` Enum

**Values:**
- `OCCUPIED` - Bed is currently occupied by a patient
- `VACANT` - Bed is available and ready for assignment
- `CLEANING` - Bed is being cleaned/maintained
- `BLOCKED` - Bed is blocked (maintenance, equipment issue, etc.)
- `RESERVED` - Bed is reserved for an assigned patient who hasn't arrived yet

**Purpose:** Tracks the real-time operational status of each bed. Critical for the live bed dashboard and availability calculations.

**Future Use:**
- Real-time bed map visualization (color-coded by status)
- Filter available beds for assignment
- Calculate occupancy percentages
- Trigger notifications when beds become available
- Track cleaning workflow (CLEANING → VACANT)

---

### `BedRequestStatus` Enum

**Values:**
- `PENDING` - Request created, awaiting approval
- `APPROVED` - Request approved, awaiting bed assignment
- `ASSIGNED` - Bed assigned, waiting for patient arrival
- `ARRIVED` - Patient has arrived and occupied the bed
- `DISCHARGED` - Patient discharged, bed needs cleaning
- `CANCELLED` - Request cancelled before completion

**Purpose:** Manages the bed request workflow lifecycle from creation to completion.

**Future Use:**
- Track request progress in coordinator dashboard
- Calculate wait times (PENDING → ASSIGNED)
- Generate SLA reports (assignment time, boarding time)
- Filter requests by status
- Trigger notifications at each status change

---

### `BedRequestPriority` Enum

**Values:**
- `LOW` - Non-urgent request
- `MEDIUM` - Standard priority (default)
- `HIGH` - Urgent request
- `CRITICAL` - Critical patient requiring immediate bed
- `EMERGENCY` - Life-threatening emergency

**Purpose:** Prioritizes bed requests to ensure critical patients get beds first.

**Future Use:**
- Sort requests by priority in coordinator queue
- Calculate priority-based wait times
- Trigger alerts for high-priority requests waiting too long
- Generate priority distribution reports

---

## Core Entities

### `Unit` Model
**Table:** `units`

**Purpose:** Represents a bed type unit within a hospital. One unit per bed type per hospital (e.g., "ICU Unit", "PICU Unit", "ED Unit").

**Key Fields:**
- `bedType` - The type of beds in this unit (BedType enum)
- `name` - Display name (e.g., "ICU Unit")
- `isActive` - Whether the unit is currently operational
- `hospitalId` - Links to the hospital

**Why It Exists:**
- Normalizes bed organization (one unit per bed type per hospital)
- Groups beds logically for filtering and reporting
- Allows unit-level permissions and management
- Enables unit-specific dashboards and KPIs

**Relations:**
- `hospital` - Parent hospital
- `beds` - All beds in this unit
- `bedRequests` - Requests for beds in this unit

**Future Use:**
- Unit nurse dashboards (show only their unit's beds)
- Unit-level capacity reports
- Unit-specific notifications
- Filter bed requests by unit
- Calculate unit occupancy rates

---

### `Bed` Model
**Table:** `beds`

**Purpose:** Individual bed record with real-time status tracking. This is the core entity that replaces the aggregated bed counts in the Hospital table.

**Key Fields:**
- `bedNumber` - Unique identifier within unit (e.g., "ICU-01", "PICU-02")
- `status` - Current operational status (BedStatus enum)
- `unitId` - Which unit this bed belongs to
- `currentPatientId` - Currently occupying patient (if any)
- `currentBedRequestId` - Active bed request for this bed
- `location` - Physical location/room number
- `isOperational` - Whether bed is functional

**Why It Exists:**
- Enables bed-level tracking (not just counts)
- Supports real-time status updates
- Allows bed assignment workflow
- Provides audit trail for each bed
- Enables bed-specific metrics and analytics

**Relations:**
- `unit` - Parent unit
- `hospital` - Parent hospital
- `currentPatient` - Currently assigned patient
- `currentBedRequest` - Active request
- `bedStatusHistory` - All status changes (audit)
- `assignedBedRequests` - Historical requests for this bed
- `bedTurnovers` - Turnover metrics

**Future Use:**
- Live bed map (real-time visualization)
- Bed status updates from floor nurses
- Bed assignment interface
- Bed availability queries
- Individual bed analytics
- Bed maintenance tracking

---

## Workflow Entities

### `BedRequest` Model
**Table:** `bed_requests`

**Purpose:** Manages the complete bed request workflow from creation to discharge. Tracks all timestamps and responsible staff at each step.

**Workflow Stages:**
1. **PENDING** - Request created by ED nurse/coordinator
2. **APPROVED** - Approved by bed coordinator
3. **ASSIGNED** - Bed assigned to request
4. **ARRIVED** - Patient arrived and occupied bed
5. **DISCHARGED** - Patient discharged, bed needs cleaning

**Key Fields:**
- `requestNumber` - Unique request ID (e.g., "BR-20240101-001")
- `patientId` - Patient needing the bed
- `unitId` - Requested unit type
- `priority` - Request priority level
- `status` - Current workflow status
- `requestedAt` - When request was created
- `approvedAt` - When request was approved
- `assignedAt` - When bed was assigned
- `arrivedAt` - When patient arrived
- `dischargedAt` - When patient was discharged
- `assignedBedId` - Which bed was assigned
- `requestedById` - Who created the request
- `approvedById` - Who approved the request
- `assignedById` - Who assigned the bed

**Why It Exists:**
- Tracks complete request lifecycle
- Enables SLA monitoring (time from request to assignment)
- Provides audit trail of all actions
- Supports notifications at each stage
- Enables analytics on request patterns

**Relations:**
- `hospital` - Hospital where request is made
- `unit` - Requested unit type
- `patient` - Patient needing bed
- `requestedBy` - User who created request
- `approvedBy` - User who approved request
- `assignedBy` - User who assigned bed
- `assignedBed` - Bed assigned to request
- `bedTurnovers` - Turnover records for this request

**Future Use:**
- Bed coordinator dashboard (pending requests)
- Request creation form (ED nurse interface)
- Bed assignment interface (drag-and-drop or click-to-assign)
- Request timeline view
- SLA monitoring (alert if assignment >30min)
- Request analytics and reporting

---

## Audit & Metrics Entities

### `BedStatusHistory` Model
**Table:** `bed_status_history`

**Purpose:** Complete audit trail of all bed status changes. Records who changed the status, when, and why.

**Key Fields:**
- `bedId` - Which bed changed status
- `previousStatus` - Status before change
- `newStatus` - Status after change
- `changedById` - User who made the change
- `changedAt` - Timestamp of change
- `reason` - Optional reason for change
- `notes` - Additional notes

**Why It Exists:**
- Full audit compliance 
- Track status change patterns
- Debug issues (why was bed blocked?)
- Generate status change reports
- Calculate time in each status

**Relations:**
- `bed` - Bed that changed status
- `changedBy` - User who made the change

**Future Use:**
- Audit log viewer
- Status change analytics
- Compliance reporting
- Debugging bed status issues
- Calculate average time in each status


---


## Migration Scripts

### `seed-bed.ts`

**Purpose:** Converts existing aggregated bed counts in the Hospital table to individual Bed records.

**What It Does:**
1. Reads all hospitals and their aggregated bed counts (icuBeds, picuBeds, etc.)
2. Creates Unit records for each bed type that has beds > 0
3. Creates individual Bed records:
   - Total beds = aggregated count
   - Available beds = VACANT status
   - Occupied beds = OCCUPIED status
4. Generates bed numbers (e.g., "ICU-01", "PICU-02")
5. Preserves all existing hospital data (no deletions)

**When to Run:**
- After initial schema migration
- One-time data migration

**How to Run:**
```bash
npm run db:seed
```

**Important Notes:**
- Does NOT delete existing aggregated fields (for backward compatibility)
- Creates new records only (INSERT operations)
- Can be run multiple times safely (checks for existing records)
- Preserves all existing hospital data


## Backward Compatibility

### Hospital Aggregated Fields

**Status:** Deprecated but preserved

**Fields:**
- `icuBeds`, `icuBedsAvailable`
- `picuBeds`, `picuBedsAvailable`
- `maleBeds`, `maleBedsAvailable`
- `femaleBeds`, `femaleBedsAvailable`
- `pediatricBeds`, `pediatricBedsAvailable`
- `standardBeds`, `standardBedsAvailable`
- `nicuBeds`, `nicuBedsAvailable`
- `strokeUnitBeds`, `strokeUnitBedsAvailable`

**Why Preserved:**
- Existing APIs may still use these fields
- Legacy integrations depend on them
- Gradual migration path

**Future Approach:**
- Compute aggregated counts from Bed records
- Update aggregated fields when beds change
- Log deprecation warnings
- Eventually remove direct usage
