-- Migration to update AssignmentStatus enum values
-- This migration updates the existing enum values to match the new terminology

-- First, update existing data to use new enum values
UPDATE ems_assignments 
SET status = CASE 
  WHEN status = 'ASSIGNED' THEN 'EMS_CONTACT'
  WHEN status = 'EN_ROUTE' THEN 'EMS_ARRIVAL'
  WHEN status = 'ARRIVED' THEN 'DEPARTED'
  WHEN status = 'PATIENT_LOADED' THEN 'DEPARTED'
  WHEN status = 'IN_TRANSIT' THEN 'DEPARTED'
  WHEN status = 'COMPLETED' THEN 'ARRIVED'
  ELSE status
END;

-- Drop the old enum type
DROP TYPE IF EXISTS "AssignmentStatus" CASCADE;

-- Create the new enum type with updated values
CREATE TYPE "AssignmentStatus" AS ENUM ('EMS_CONTACT', 'EMS_ARRIVAL', 'DEPARTED', 'ARRIVED', 'CANCELLED');

-- Update the column to use the new enum type
ALTER TABLE ems_assignments 
ALTER COLUMN status TYPE "AssignmentStatus" 
USING status::text::"AssignmentStatus";

-- Set the default value
ALTER TABLE ems_assignments 
ALTER COLUMN status SET DEFAULT 'EMS_CONTACT';





