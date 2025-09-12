-- Migration: Replace estimatedArrival with emsContactTime
-- This migration preserves existing data while updating field names

-- Step 1: Add new ems_contact_time column to tickets table
ALTER TABLE tickets ADD COLUMN ems_contact_time TIMESTAMP;

-- Step 2: Copy data from estimated_arrival to ems_contact_time
UPDATE tickets 
SET ems_contact_time = estimated_arrival 
WHERE estimated_arrival IS NOT NULL;

-- Step 3: Add new ems_contact_time column to ems_assignments table
ALTER TABLE ems_assignments ADD COLUMN ems_contact_time TIMESTAMP;

-- Step 4: Copy data from estimated_arrival_time to ems_contact_time
UPDATE ems_assignments 
SET ems_contact_time = estimated_arrival_time 
WHERE estimated_arrival_time IS NOT NULL;

-- Step 5: Drop old columns (commented out for safety - uncomment after verification)
-- ALTER TABLE tickets DROP COLUMN estimated_arrival;
-- ALTER TABLE ems_assignments DROP COLUMN estimated_arrival_time;

-- Verification queries (run these to check data migration)
-- SELECT COUNT(*) as total_tickets FROM tickets;
-- SELECT COUNT(*) as tickets_with_ems_contact_time FROM tickets WHERE ems_contact_time IS NOT NULL;
-- SELECT COUNT(*) as total_assignments FROM ems_assignments;
-- SELECT COUNT(*) as assignments_with_ems_contact_time FROM ems_assignments WHERE ems_contact_time IS NOT NULL;
