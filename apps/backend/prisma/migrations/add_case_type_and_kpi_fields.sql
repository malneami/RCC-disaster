-- Migration: Add case_type and new KPI fields to stemi_cases table
-- This migration adds support for dual Door to Balloon KPIs (Direct vs Transfer)

-- Add case_type field
ALTER TABLE "stemi_cases" ADD COLUMN "case_type" VARCHAR(20) DEFAULT 'DIRECT';

-- Add new KPI fields for direct and transfer cases
ALTER TABLE "stemi_cases" ADD COLUMN "met_kpi_2_direct" BOOLEAN;
ALTER TABLE "stemi_cases" ADD COLUMN "met_kpi_2_transfer" BOOLEAN;

-- Update existing cases to determine case type based on hospital services
-- This is a simplified approach - in production, you might want to run this
-- as a separate data migration script with proper hospital service validation

-- Set case_type to 'TRANSFER' for cases with different origin and destination hospitals
UPDATE "stemi_cases" 
SET "case_type" = 'TRANSFER' 
WHERE "destination_hospital_id" IS NOT NULL 
  AND "destination_hospital_id" != "origin_hospital_id";

-- Update KPI flags for existing cases
UPDATE "stemi_cases" 
SET "met_kpi_2_direct" = CASE 
  WHEN "case_type" = 'DIRECT' AND "door_to_balloon_minutes" IS NOT NULL 
    THEN "door_to_balloon_minutes" <= 90 
  ELSE false 
END,
"met_kpi_2_transfer" = CASE 
  WHEN "case_type" = 'TRANSFER' AND "door_to_balloon_minutes" IS NOT NULL 
    THEN "door_to_balloon_minutes" <= 120 
  ELSE false 
END;

-- Update the main metKpi2 field to reflect the appropriate target based on case type
UPDATE "stemi_cases" 
SET "met_kpi_2" = CASE 
  WHEN "case_type" = 'DIRECT' AND "door_to_balloon_minutes" IS NOT NULL 
    THEN "door_to_balloon_minutes" <= 90 
  WHEN "case_type" = 'TRANSFER' AND "door_to_balloon_minutes" IS NOT NULL 
    THEN "door_to_balloon_minutes" <= 120 
  ELSE "met_kpi_2" 
END;

-- Add indexes for better query performance
CREATE INDEX "stemi_cases_case_type_idx" ON "stemi_cases"("case_type");
CREATE INDEX "stemi_cases_met_kpi_2_direct_idx" ON "stemi_cases"("met_kpi_2_direct");
CREATE INDEX "stemi_cases_met_kpi_2_transfer_idx" ON "stemi_cases"("met_kpi_2_transfer");
