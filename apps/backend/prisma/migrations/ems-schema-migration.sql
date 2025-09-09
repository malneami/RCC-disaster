-- EMS Schema Migration Script
-- This script creates all EMS-related tables and indexes for the Emergency Medical Services portal

-- Create EMS-specific enums
CREATE TYPE "AmbulanceStatus" AS ENUM ('AVAILABLE', 'IN_USE', 'MAINTENANCE', 'OFFLINE', 'OUT_OF_SERVICE');
CREATE TYPE "AmbulanceType" AS ENUM ('STANDARD', 'ICU', 'NEONATAL', 'CARDIAC', 'TRAUMA', 'AIR_AMBULANCE', 'MOTORCYCLE');
CREATE TYPE "EquipmentStatus" AS ENUM ('OPERATIONAL', 'NEEDS_REPAIR', 'OUT_OF_SERVICE', 'MAINTENANCE_DUE', 'EXPIRED');
CREATE TYPE "AssignmentStatus" AS ENUM ('ASSIGNED', 'EN_ROUTE', 'ARRIVED', 'PATIENT_LOADED', 'IN_TRANSIT', 'ARRIVED_DESTINATION', 'COMPLETED', 'CANCELLED');
CREATE TYPE "ShiftType" AS ENUM ('DAY', 'NIGHT', 'TWENTY_FOUR_HOUR', 'PART_TIME', 'ON_CALL');
CREATE TYPE "ScheduleStatus" AS ENUM ('SCHEDULED', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'NO_SHOW');
CREATE TYPE "AlertType" AS ENUM ('LOW_FUEL', 'MAINTENANCE_DUE', 'DRIVER_OVERTIME', 'SPEEDING_VIOLATION', 'EMERGENCY_BUTTON', 'GPS_SIGNAL_LOST', 'EQUIPMENT_MALFUNCTION', 'PATIENT_EMERGENCY', 'VEHICLE_BREAKDOWN', 'ROUTE_DEVIATION');
CREATE TYPE "AlertPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE "AlertStatus" AS ENUM ('ACTIVE', 'ACKNOWLEDGED', 'RESOLVED', 'ESCALATED');
CREATE TYPE "EMSEventType" AS ENUM ('AMBULANCE_DISPATCHED', 'AMBULANCE_ARRIVED', 'PATIENT_LOADED', 'TRANSFER_STARTED', 'APPROACHING_DESTINATION', 'ARRIVED_AT_DESTINATION', 'PATIENT_UNLOADED', 'RETURN_TO_BASE', 'EMERGENCY_STOP', 'FUEL_STOP', 'BREAK_START', 'BREAK_END', 'MAINTENANCE_START', 'MAINTENANCE_COMPLETE');
CREATE TYPE "PerformanceMetricType" AS ENUM ('RESPONSE_TIME', 'TRANSFER_TIME', 'DISTANCE_TRAVELED', 'FUEL_CONSUMPTION', 'MAINTENANCE_HOURS', 'DRIVER_RATING', 'PATIENT_SATISFACTION', 'EQUIPMENT_UPTIME');
CREATE TYPE "MaintenanceType" AS ENUM ('PREVENTIVE', 'CORRECTIVE', 'EMERGENCY', 'INSPECTION', 'CALIBRATION');
CREATE TYPE "MaintenanceStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'OVERDUE');

-- Update ActivityType enum to include EMS activities
ALTER TYPE "ActivityType" ADD VALUE 'AMBULANCE_CREATED';
ALTER TYPE "ActivityType" ADD VALUE 'AMBULANCE_UPDATED';
ALTER TYPE "ActivityType" ADD VALUE 'AMBULANCE_ASSIGNED';
ALTER TYPE "ActivityType" ADD VALUE 'EMS_ASSIGNMENT_CREATED';
ALTER TYPE "ActivityType" ADD VALUE 'EMS_ASSIGNMENT_UPDATED';
ALTER TYPE "ActivityType" ADD VALUE 'GPS_TRACKING_UPDATED';
ALTER TYPE "ActivityType" ADD VALUE 'DRIVER_SCHEDULE_CREATED';
ALTER TYPE "ActivityType" ADD VALUE 'DRIVER_SCHEDULE_UPDATED';
ALTER TYPE "ActivityType" ADD VALUE 'EQUIPMENT_INSPECTED';
ALTER TYPE "ActivityType" ADD VALUE 'MAINTENANCE_SCHEDULED';
ALTER TYPE "ActivityType" ADD VALUE 'MAINTENANCE_COMPLETED';
ALTER TYPE "ActivityType" ADD VALUE 'ALERT_CREATED';
ALTER TYPE "ActivityType" ADD VALUE 'ALERT_ACKNOWLEDGED';
ALTER TYPE "ActivityType" ADD VALUE 'ALERT_RESOLVED';

-- Create ambulances table
CREATE TABLE "ambulances" (
    "id" TEXT NOT NULL,
    "vehicle_id" TEXT NOT NULL,
    "call_sign" TEXT NOT NULL,
    "plate_number" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "type" "AmbulanceType" NOT NULL,
    "manufacturer" TEXT,
    "vin" TEXT,
    "base_station" TEXT NOT NULL,
    "status" "AmbulanceStatus" NOT NULL DEFAULT 'AVAILABLE',
    "current_location_lat" DOUBLE PRECISION,
    "current_location_lng" DOUBLE PRECISION,
    "current_location_address" TEXT,
    "last_updated" TIMESTAMP(3),
    "driver_name" TEXT,
    "driver_phone" TEXT,
    "driver_id" TEXT,
    "equipment_status" "EquipmentStatus" NOT NULL DEFAULT 'OPERATIONAL',
    "fuel_level" DOUBLE PRECISION,
    "mileage" DOUBLE PRECISION,
    "last_maintenance_date" TIMESTAMP(3),
    "next_maintenance_due" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "ambulances_pkey" PRIMARY KEY ("id")
);

-- Create ems_assignments table
CREATE TABLE "ems_assignments" (
    "id" TEXT NOT NULL,
    "ticket_id" TEXT NOT NULL,
    "ambulance_id" TEXT NOT NULL,
    "driver_id" TEXT NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL,
    "status" "AssignmentStatus" NOT NULL DEFAULT 'ASSIGNED',
    "estimated_arrival_time" TIMESTAMP(3),
    "actual_arrival_time" TIMESTAMP(3),
    "journey_start_time" TIMESTAMP(3),
    "journey_end_time" TIMESTAMP(3),
    "distance_km" DOUBLE PRECISION,
    "notes" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "ems_assignments_pkey" PRIMARY KEY ("id")
);

-- Create gps_tracking_logs table
CREATE TABLE "gps_tracking_logs" (
    "id" TEXT NOT NULL,
    "ambulance_id" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "speed" DOUBLE PRECISION,
    "direction" DOUBLE PRECISION,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "fuel_level" DOUBLE PRECISION,
    "engine_status" BOOLEAN,
    "location_address" TEXT,
    "accuracy" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gps_tracking_logs_pkey" PRIMARY KEY ("id")
);

-- Create driver_schedules table
CREATE TABLE "driver_schedules" (
    "id" TEXT NOT NULL,
    "driver_id" TEXT NOT NULL,
    "ambulance_id" TEXT NOT NULL,
    "shift_start" TIMESTAMP(3) NOT NULL,
    "shift_end" TIMESTAMP(3) NOT NULL,
    "shift_type" "ShiftType" NOT NULL,
    "status" "ScheduleStatus" NOT NULL DEFAULT 'SCHEDULED',
    "break_start" TIMESTAMP(3),
    "break_end" TIMESTAMP(3),
    "overtime_hours" DOUBLE PRECISION,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "driver_schedules_pkey" PRIMARY KEY ("id")
);

-- Create equipment_inventory table
CREATE TABLE "equipment_inventory" (
    "id" TEXT NOT NULL,
    "ambulance_id" TEXT NOT NULL,
    "equipment_type" TEXT NOT NULL,
    "serial_number" TEXT,
    "manufacturer" TEXT,
    "model" TEXT,
    "status" "EquipmentStatus" NOT NULL DEFAULT 'OPERATIONAL',
    "last_inspection_date" TIMESTAMP(3),
    "next_inspection_due" TIMESTAMP(3),
    "maintenance_notes" TEXT,
    "purchase_date" TIMESTAMP(3),
    "warranty_expiry" TIMESTAMP(3),
    "location" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "equipment_inventory_pkey" PRIMARY KEY ("id")
);

-- Create ems_performance_metrics table
CREATE TABLE "ems_performance_metrics" (
    "id" TEXT NOT NULL,
    "ambulance_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "total_transfers" INTEGER NOT NULL,
    "average_response_time" DOUBLE PRECISION,
    "average_transfer_time" DOUBLE PRECISION,
    "total_distance_km" DOUBLE PRECISION,
    "fuel_consumption_liters" DOUBLE PRECISION,
    "maintenance_hours" DOUBLE PRECISION,
    "driver_rating" DOUBLE PRECISION,
    "patient_satisfaction_score" DOUBLE PRECISION,
    "on_time_arrivals" INTEGER,
    "delayed_arrivals" INTEGER,
    "cancelled_transfers" INTEGER,
    "equipment_failures" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ems_performance_metrics_pkey" PRIMARY KEY ("id")
);

-- Create ems_alerts table
CREATE TABLE "ems_alerts" (
    "id" TEXT NOT NULL,
    "type" "AlertType" NOT NULL,
    "priority" "AlertPriority" NOT NULL,
    "message" TEXT NOT NULL,
    "ambulance_id" TEXT,
    "driver_id" TEXT,
    "equipment_id" TEXT,
    "status" "AlertStatus" NOT NULL DEFAULT 'ACTIVE',
    "acknowledged_by" TEXT,
    "acknowledged_at" TIMESTAMP(3),
    "resolved_at" TIMESTAMP(3),
    "metadata" TEXT,
    "escalation_level" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ems_alerts_pkey" PRIMARY KEY ("id")
);

-- Create maintenance_records table
CREATE TABLE "maintenance_records" (
    "id" TEXT NOT NULL,
    "ambulance_id" TEXT,
    "equipment_id" TEXT,
    "type" "MaintenanceType" NOT NULL,
    "status" "MaintenanceStatus" NOT NULL DEFAULT 'SCHEDULED',
    "description" TEXT NOT NULL,
    "work_performed" TEXT,
    "scheduled_date" TIMESTAMP(3),
    "start_date" TIMESTAMP(3),
    "completion_date" TIMESTAMP(3),
    "cost" DOUBLE PRECISION,
    "labor_hours" DOUBLE PRECISION,
    "parts_used" TEXT,
    "technician_name" TEXT,
    "mileage_at_service" DOUBLE PRECISION,
    "next_service_due" TIMESTAMP(3),
    "warranty_work" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT NOT NULL,

    CONSTRAINT "maintenance_records_pkey" PRIMARY KEY ("id")
);

-- Create timeline_events table (enhanced for EMS)
CREATE TABLE "timeline_events" (
    "id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "event_category" TEXT NOT NULL,
    "ticket_id" TEXT,
    "stroke_case_id" TEXT,
    "ambulance_id" TEXT,
    "driver_id" TEXT,
    "event_timestamp" TIMESTAMP(3) NOT NULL,
    "event_description" TEXT NOT NULL,
    "event_location" TEXT,
    "gps_coordinates" TEXT,
    "distance_km" DOUBLE PRECISION,
    "speed" DOUBLE PRECISION,
    "fuel_level" DOUBLE PRECISION,
    "from_status" TEXT,
    "to_status" TEXT,
    "minutes_from_symptom" INTEGER,
    "minutes_from_admission" INTEGER,
    "within_target" BOOLEAN,
    "target_minutes" INTEGER,
    "nihss_at_session" INTEGER,
    "clinical_notes" TEXT,
    "triggered_by" TEXT NOT NULL,
    "metadata" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" TEXT NOT NULL,

    CONSTRAINT "timeline_events_pkey" PRIMARY KEY ("id")
);

-- Add unique constraints
ALTER TABLE "ambulances" ADD CONSTRAINT "ambulances_vehicle_id_key" UNIQUE ("vehicle_id");
ALTER TABLE "ambulances" ADD CONSTRAINT "ambulances_call_sign_key" UNIQUE ("call_sign");
ALTER TABLE "ambulances" ADD CONSTRAINT "ambulances_plate_number_key" UNIQUE ("plate_number");
ALTER TABLE "ambulances" ADD CONSTRAINT "ambulances_vin_key" UNIQUE ("vin");
ALTER TABLE "ems_performance_metrics" ADD CONSTRAINT "ems_performance_metrics_ambulance_id_date_key" UNIQUE ("ambulance_id", "date");

-- Add foreign key constraints
ALTER TABLE "ambulances" ADD CONSTRAINT "ambulances_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ems_assignments" ADD CONSTRAINT "ems_assignments_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ems_assignments" ADD CONSTRAINT "ems_assignments_ambulance_id_fkey" FOREIGN KEY ("ambulance_id") REFERENCES "ambulances"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ems_assignments" ADD CONSTRAINT "ems_assignments_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ems_assignments" ADD CONSTRAINT "ems_assignments_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "gps_tracking_logs" ADD CONSTRAINT "gps_tracking_logs_ambulance_id_fkey" FOREIGN KEY ("ambulance_id") REFERENCES "ambulances"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "driver_schedules" ADD CONSTRAINT "driver_schedules_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "driver_schedules" ADD CONSTRAINT "driver_schedules_ambulance_id_fkey" FOREIGN KEY ("ambulance_id") REFERENCES "ambulances"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "equipment_inventory" ADD CONSTRAINT "equipment_inventory_ambulance_id_fkey" FOREIGN KEY ("ambulance_id") REFERENCES "ambulances"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ems_performance_metrics" ADD CONSTRAINT "ems_performance_metrics_ambulance_id_fkey" FOREIGN KEY ("ambulance_id") REFERENCES "ambulances"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ems_alerts" ADD CONSTRAINT "ems_alerts_ambulance_id_fkey" FOREIGN KEY ("ambulance_id") REFERENCES "ambulances"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ems_alerts" ADD CONSTRAINT "ems_alerts_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ems_alerts" ADD CONSTRAINT "ems_alerts_acknowledged_by_fkey" FOREIGN KEY ("acknowledged_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ems_alerts" ADD CONSTRAINT "ems_alerts_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "equipment_inventory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "maintenance_records" ADD CONSTRAINT "maintenance_records_ambulance_id_fkey" FOREIGN KEY ("ambulance_id") REFERENCES "ambulances"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "maintenance_records" ADD CONSTRAINT "maintenance_records_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "equipment_inventory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "maintenance_records" ADD CONSTRAINT "maintenance_records_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "timeline_events" ADD CONSTRAINT "timeline_events_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "timeline_events" ADD CONSTRAINT "timeline_events_stroke_case_id_fkey" FOREIGN KEY ("stroke_case_id") REFERENCES "stroke_cases"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "timeline_events" ADD CONSTRAINT "timeline_events_ambulance_id_fkey" FOREIGN KEY ("ambulance_id") REFERENCES "ambulances"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "timeline_events" ADD CONSTRAINT "timeline_events_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "timeline_events" ADD CONSTRAINT "timeline_events_triggered_by_fkey" FOREIGN KEY ("triggered_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "timeline_events" ADD CONSTRAINT "timeline_events_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Create indexes for performance
CREATE INDEX "ambulances_status_idx" ON "ambulances"("status");
CREATE INDEX "ambulances_base_station_idx" ON "ambulances"("base_station");
CREATE INDEX "ambulances_is_active_idx" ON "ambulances"("is_active");
CREATE INDEX "ambulances_vehicle_id_idx" ON "ambulances"("vehicle_id");
CREATE INDEX "ambulances_plate_number_idx" ON "ambulances"("plate_number");
CREATE INDEX "ambulances_call_sign_idx" ON "ambulances"("call_sign");
CREATE INDEX "ambulances_driver_id_idx" ON "ambulances"("driver_id");
CREATE INDEX "ambulances_next_maintenance_due_idx" ON "ambulances"("next_maintenance_due");

CREATE INDEX "ems_assignments_ticket_id_idx" ON "ems_assignments"("ticket_id");
CREATE INDEX "ems_assignments_ambulance_id_idx" ON "ems_assignments"("ambulance_id");
CREATE INDEX "ems_assignments_driver_id_idx" ON "ems_assignments"("driver_id");
CREATE INDEX "ems_assignments_status_idx" ON "ems_assignments"("status");
CREATE INDEX "ems_assignments_assigned_at_idx" ON "ems_assignments"("assigned_at");
CREATE INDEX "ems_assignments_created_at_idx" ON "ems_assignments"("created_at");

CREATE INDEX "gps_tracking_logs_ambulance_id_idx" ON "gps_tracking_logs"("ambulance_id");
CREATE INDEX "gps_tracking_logs_timestamp_idx" ON "gps_tracking_logs"("timestamp");
CREATE INDEX "gps_tracking_logs_latitude_longitude_idx" ON "gps_tracking_logs"("latitude", "longitude");
CREATE INDEX "gps_tracking_logs_created_at_idx" ON "gps_tracking_logs"("created_at");

CREATE INDEX "driver_schedules_driver_id_idx" ON "driver_schedules"("driver_id");
CREATE INDEX "driver_schedules_ambulance_id_idx" ON "driver_schedules"("ambulance_id");
CREATE INDEX "driver_schedules_shift_start_idx" ON "driver_schedules"("shift_start");
CREATE INDEX "driver_schedules_shift_end_idx" ON "driver_schedules"("shift_end");
CREATE INDEX "driver_schedules_status_idx" ON "driver_schedules"("status");
CREATE INDEX "driver_schedules_shift_type_idx" ON "driver_schedules"("shift_type");
CREATE INDEX "driver_schedules_created_at_idx" ON "driver_schedules"("created_at");

CREATE INDEX "equipment_inventory_ambulance_id_idx" ON "equipment_inventory"("ambulance_id");
CREATE INDEX "equipment_inventory_equipment_type_idx" ON "equipment_inventory"("equipment_type");
CREATE INDEX "equipment_inventory_status_idx" ON "equipment_inventory"("status");
CREATE INDEX "equipment_inventory_serial_number_idx" ON "equipment_inventory"("serial_number");
CREATE INDEX "equipment_inventory_next_inspection_due_idx" ON "equipment_inventory"("next_inspection_due");
CREATE INDEX "equipment_inventory_created_at_idx" ON "equipment_inventory"("created_at");

CREATE INDEX "ems_performance_metrics_ambulance_id_idx" ON "ems_performance_metrics"("ambulance_id");
CREATE INDEX "ems_performance_metrics_date_idx" ON "ems_performance_metrics"("date");
CREATE INDEX "ems_performance_metrics_created_at_idx" ON "ems_performance_metrics"("created_at");

CREATE INDEX "ems_alerts_type_idx" ON "ems_alerts"("type");
CREATE INDEX "ems_alerts_priority_idx" ON "ems_alerts"("priority");
CREATE INDEX "ems_alerts_status_idx" ON "ems_alerts"("status");
CREATE INDEX "ems_alerts_ambulance_id_idx" ON "ems_alerts"("ambulance_id");
CREATE INDEX "ems_alerts_driver_id_idx" ON "ems_alerts"("driver_id");
CREATE INDEX "ems_alerts_created_at_idx" ON "ems_alerts"("created_at");
CREATE INDEX "ems_alerts_acknowledged_at_idx" ON "ems_alerts"("acknowledged_at");

CREATE INDEX "maintenance_records_ambulance_id_idx" ON "maintenance_records"("ambulance_id");
CREATE INDEX "maintenance_records_equipment_id_idx" ON "maintenance_records"("equipment_id");
CREATE INDEX "maintenance_records_type_idx" ON "maintenance_records"("type");
CREATE INDEX "maintenance_records_status_idx" ON "maintenance_records"("status");
CREATE INDEX "maintenance_records_scheduled_date_idx" ON "maintenance_records"("scheduled_date");
CREATE INDEX "maintenance_records_completion_date_idx" ON "maintenance_records"("completion_date");
CREATE INDEX "maintenance_records_next_service_due_idx" ON "maintenance_records"("next_service_due");
CREATE INDEX "maintenance_records_created_at_idx" ON "maintenance_records"("created_at");

CREATE INDEX "timeline_events_event_type_idx" ON "timeline_events"("event_type");
CREATE INDEX "timeline_events_event_category_idx" ON "timeline_events"("event_category");
CREATE INDEX "timeline_events_ticket_id_idx" ON "timeline_events"("ticket_id");
CREATE INDEX "timeline_events_stroke_case_id_idx" ON "timeline_events"("stroke_case_id");
CREATE INDEX "timeline_events_ambulance_id_idx" ON "timeline_events"("ambulance_id");
CREATE INDEX "timeline_events_driver_id_idx" ON "timeline_events"("driver_id");
CREATE INDEX "timeline_events_event_timestamp_idx" ON "timeline_events"("event_timestamp");
CREATE INDEX "timeline_events_created_at_idx" ON "timeline_events"("created_at");

-- Add check constraints for data validation
ALTER TABLE "ambulances" ADD CONSTRAINT "ambulances_fuel_level_check" CHECK ("fuel_level" >= 0 AND "fuel_level" <= 100);
ALTER TABLE "ambulances" ADD CONSTRAINT "ambulances_mileage_check" CHECK ("mileage" >= 0);
ALTER TABLE "ambulances" ADD CONSTRAINT "ambulances_year_check" CHECK ("year" >= 1900 AND "year" <= EXTRACT(YEAR FROM CURRENT_DATE) + 1);

ALTER TABLE "gps_tracking_logs" ADD CONSTRAINT "gps_tracking_logs_latitude_check" CHECK ("latitude" >= -90 AND "latitude" <= 90);
ALTER TABLE "gps_tracking_logs" ADD CONSTRAINT "gps_tracking_logs_longitude_check" CHECK ("longitude" >= -180 AND "longitude" <= 180);
ALTER TABLE "gps_tracking_logs" ADD CONSTRAINT "gps_tracking_logs_speed_check" CHECK ("speed" >= 0);
ALTER TABLE "gps_tracking_logs" ADD CONSTRAINT "gps_tracking_logs_direction_check" CHECK ("direction" >= 0 AND "direction" <= 360);
ALTER TABLE "gps_tracking_logs" ADD CONSTRAINT "gps_tracking_logs_fuel_level_check" CHECK ("fuel_level" >= 0 AND "fuel_level" <= 100);

ALTER TABLE "ems_performance_metrics" ADD CONSTRAINT "ems_performance_metrics_total_transfers_check" CHECK ("total_transfers" >= 0);
ALTER TABLE "ems_performance_metrics" ADD CONSTRAINT "ems_performance_metrics_average_response_time_check" CHECK ("average_response_time" >= 0);
ALTER TABLE "ems_performance_metrics" ADD CONSTRAINT "ems_performance_metrics_average_transfer_time_check" CHECK ("average_transfer_time" >= 0);
ALTER TABLE "ems_performance_metrics" ADD CONSTRAINT "ems_performance_metrics_total_distance_km_check" CHECK ("total_distance_km" >= 0);
ALTER TABLE "ems_performance_metrics" ADD CONSTRAINT "ems_performance_metrics_fuel_consumption_liters_check" CHECK ("fuel_consumption_liters" >= 0);
ALTER TABLE "ems_performance_metrics" ADD CONSTRAINT "ems_performance_metrics_maintenance_hours_check" CHECK ("maintenance_hours" >= 0);
ALTER TABLE "ems_performance_metrics" ADD CONSTRAINT "ems_performance_metrics_driver_rating_check" CHECK ("driver_rating" >= 1 AND "driver_rating" <= 5);
ALTER TABLE "ems_performance_metrics" ADD CONSTRAINT "ems_performance_metrics_patient_satisfaction_score_check" CHECK ("patient_satisfaction_score" >= 1 AND "patient_satisfaction_score" <= 10);

ALTER TABLE "maintenance_records" ADD CONSTRAINT "maintenance_records_cost_check" CHECK ("cost" >= 0);
ALTER TABLE "maintenance_records" ADD CONSTRAINT "maintenance_records_labor_hours_check" CHECK ("labor_hours" >= 0);
ALTER TABLE "maintenance_records" ADD CONSTRAINT "maintenance_records_mileage_at_service_check" CHECK ("mileage_at_service" >= 0);

-- Create triggers for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ambulances_updated_at BEFORE UPDATE ON ambulances FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ems_assignments_updated_at BEFORE UPDATE ON ems_assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_driver_schedules_updated_at BEFORE UPDATE ON driver_schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_equipment_inventory_updated_at BEFORE UPDATE ON equipment_inventory FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ems_performance_metrics_updated_at BEFORE UPDATE ON ems_performance_metrics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ems_alerts_updated_at BEFORE UPDATE ON ems_alerts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_maintenance_records_updated_at BEFORE UPDATE ON maintenance_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to automatically update ambulance last_updated timestamp when GPS data is received
CREATE OR REPLACE FUNCTION update_ambulance_last_updated()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE ambulances 
    SET last_updated = NEW.timestamp,
        current_location_lat = NEW.latitude,
        current_location_lng = NEW.longitude,
        current_location_address = NEW.location_address,
        fuel_level = COALESCE(NEW.fuel_level, fuel_level)
    WHERE id = NEW.ambulance_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ambulance_location_on_gps_update 
    AFTER INSERT ON gps_tracking_logs 
    FOR EACH ROW EXECUTE FUNCTION update_ambulance_last_updated();

-- Create function to automatically create timeline events for EMS activities
CREATE OR REPLACE FUNCTION create_ems_timeline_event()
RETURNS TRIGGER AS $$
BEGIN
    -- Create timeline event for assignment status changes
    IF TG_TABLE_NAME = 'ems_assignments' THEN
        INSERT INTO timeline_events (
            event_type, event_category, ticket_id, ambulance_id, driver_id,
            event_timestamp, event_description, triggered_by, created_by_id
        ) VALUES (
            CASE 
                WHEN NEW.status = 'ASSIGNED' THEN 'AMBULANCE_DISPATCHED'
                WHEN NEW.status = 'EN_ROUTE' THEN 'TRANSFER_STARTED'
                WHEN NEW.status = 'ARRIVED' THEN 'AMBULANCE_ARRIVED'
                WHEN NEW.status = 'PATIENT_LOADED' THEN 'PATIENT_LOADED'
                WHEN NEW.status = 'IN_TRANSIT' THEN 'TRANSFER_STARTED'
                WHEN NEW.status = 'ARRIVED_DESTINATION' THEN 'ARRIVED_AT_DESTINATION'
                WHEN NEW.status = 'COMPLETED' THEN 'PATIENT_UNLOADED'
                ELSE 'TRANSFER_STARTED'
            END,
            'EMS',
            NEW.ticket_id,
            NEW.ambulance_id,
            NEW.driver_id,
            CURRENT_TIMESTAMP,
            'Assignment status changed to ' || NEW.status,
            NEW.created_by,
            NEW.created_by
        );
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER create_timeline_event_on_assignment_change 
    AFTER INSERT OR UPDATE ON ems_assignments 
    FOR EACH ROW EXECUTE FUNCTION create_ems_timeline_event();

-- Create function to automatically create alerts for maintenance due
CREATE OR REPLACE FUNCTION check_maintenance_alerts()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if maintenance is due within 7 days
    IF NEW.next_maintenance_due IS NOT NULL AND NEW.next_maintenance_due <= (CURRENT_DATE + INTERVAL '7 days') THEN
        INSERT INTO ems_alerts (
            type, priority, message, ambulance_id, status
        ) VALUES (
            'MAINTENANCE_DUE',
            CASE 
                WHEN NEW.next_maintenance_due <= CURRENT_DATE THEN 'CRITICAL'
                WHEN NEW.next_maintenance_due <= (CURRENT_DATE + INTERVAL '3 days') THEN 'HIGH'
                ELSE 'MEDIUM'
            END,
            'Maintenance due for ambulance ' || NEW.call_sign || ' on ' || NEW.next_maintenance_due::text,
            NEW.id,
            'ACTIVE'
        );
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER check_maintenance_alerts_trigger 
    AFTER INSERT OR UPDATE ON ambulances 
    FOR EACH ROW EXECUTE FUNCTION check_maintenance_alerts();

-- Create function to automatically create alerts for low fuel
CREATE OR REPLACE FUNCTION check_fuel_alerts()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if fuel level is below 20%
    IF NEW.fuel_level IS NOT NULL AND NEW.fuel_level <= 20 THEN
        INSERT INTO ems_alerts (
            type, priority, message, ambulance_id, status
        ) VALUES (
            'LOW_FUEL',
            CASE 
                WHEN NEW.fuel_level <= 10 THEN 'CRITICAL'
                WHEN NEW.fuel_level <= 15 THEN 'HIGH'
                ELSE 'MEDIUM'
            END,
            'Low fuel alert for ambulance ' || NEW.call_sign || ': ' || NEW.fuel_level || '% remaining',
            NEW.id,
            'ACTIVE'
        );
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER check_fuel_alerts_trigger 
    AFTER INSERT OR UPDATE ON ambulances 
    FOR EACH ROW EXECUTE FUNCTION check_fuel_alerts();

-- Create function to automatically create alerts for equipment inspection due
CREATE OR REPLACE FUNCTION check_equipment_inspection_alerts()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if equipment inspection is due within 7 days
    IF NEW.next_inspection_due IS NOT NULL AND NEW.next_inspection_due <= (CURRENT_DATE + INTERVAL '7 days') THEN
        INSERT INTO ems_alerts (
            type, priority, message, equipment_id, ambulance_id, status
        ) VALUES (
            'MAINTENANCE_DUE',
            CASE 
                WHEN NEW.next_inspection_due <= CURRENT_DATE THEN 'CRITICAL'
                WHEN NEW.next_inspection_due <= (CURRENT_DATE + INTERVAL '3 days') THEN 'HIGH'
                ELSE 'MEDIUM'
            END,
            'Equipment inspection due for ' || NEW.equipment_type || ' (Serial: ' || COALESCE(NEW.serial_number, 'N/A') || ') on ' || NEW.next_inspection_due::text,
            NEW.id,
            NEW.ambulance_id,
            'ACTIVE'
        );
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER check_equipment_inspection_alerts_trigger 
    AFTER INSERT OR UPDATE ON equipment_inventory 
    FOR EACH ROW EXECUTE FUNCTION check_equipment_inspection_alerts();

COMMIT;


