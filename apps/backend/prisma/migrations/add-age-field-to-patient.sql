-- Migration: Add age field to patients table and convert dateOfBirth to age
-- This migration:
-- 1. Adds age column to patients table
-- 2. Calculates age from existing dateOfBirth values
-- 3. Makes dateOfBirth nullable for gradual migration

-- Step 1: Add age column
ALTER TABLE patients ADD COLUMN age INTEGER;

-- Step 2: Calculate age from dateOfBirth and update records
UPDATE patients 
SET age = EXTRACT(YEAR FROM AGE(date_of_birth))
WHERE date_of_birth IS NOT NULL;

-- Step 3: Make dateOfBirth nullable (for gradual migration)
ALTER TABLE patients ALTER COLUMN date_of_birth DROP NOT NULL;

-- Step 4: Add index on age column for better performance
CREATE INDEX idx_patients_age ON patients(age);

-- Step 5: Add comment to document the migration
COMMENT ON COLUMN patients.age IS 'Age in years, calculated from date_of_birth during migration';
COMMENT ON COLUMN patients.date_of_birth IS 'Date of birth - will be removed after migration to age field is complete';
