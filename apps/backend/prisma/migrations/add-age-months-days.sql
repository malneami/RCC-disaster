-- Migration: Add ageMonths and ageDays fields to patients table
-- This migration adds support for storing precise age information (years, months, days)
-- when age is manually entered instead of calculated from date of birth

-- Step 1: Add age_months column
ALTER TABLE patients ADD COLUMN IF NOT EXISTS age_months INTEGER;

-- Step 2: Add age_days column
ALTER TABLE patients ADD COLUMN IF NOT EXISTS age_days INTEGER;

-- Step 3: Add comments to document the new fields
COMMENT ON COLUMN patients.age_months IS 'Age in months (for precise age when manually entered, e.g., "5 years, 3 months")';
COMMENT ON COLUMN patients.age_days IS 'Age in days (for precise age when manually entered, e.g., "5 years, 3 months, 10 days")';

