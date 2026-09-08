-- Add DisasterAssignmentStatus enum and destination hospital for disaster ambulance assignments

-- Step 1: Create enum
DO $$ BEGIN
  CREATE TYPE "DisasterAssignmentStatus" AS ENUM (
    'EN_ROUTE',
    'AT_SCENE',
    'PATIENT_LOADED',
    'EN_ROUTE_TO_HOSPITAL',
    'ARRIVED'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Step 2: Add destination_hospital_id column
ALTER TABLE "disaster_ambulance_assignments" ADD COLUMN IF NOT EXISTS "destination_hospital_id" TEXT;

-- Step 3: Convert status column to enum (map IN_USE -> AT_SCENE, DEPARTED -> EN_ROUTE_TO_HOSPITAL, etc.)
ALTER TABLE "disaster_ambulance_assignments" ALTER COLUMN "status" DROP DEFAULT;

ALTER TABLE "disaster_ambulance_assignments"
  ALTER COLUMN "status" TYPE "DisasterAssignmentStatus"
  USING (
    CASE
      WHEN "status"::text IN ('EN_ROUTE', 'EMS_CONTACT') THEN 'EN_ROUTE'::"DisasterAssignmentStatus"
      WHEN "status"::text IN ('IN_USE', 'AT_SCENE', 'EMS_ARRIVAL') THEN 'AT_SCENE'::"DisasterAssignmentStatus"
      WHEN "status"::text = 'PATIENT_LOADED' THEN 'PATIENT_LOADED'::"DisasterAssignmentStatus"
      WHEN "status"::text IN ('DEPARTED', 'EN_ROUTE_TO_HOSPITAL') THEN 'EN_ROUTE_TO_HOSPITAL'::"DisasterAssignmentStatus"
      WHEN "status"::text = 'ARRIVED' THEN 'ARRIVED'::"DisasterAssignmentStatus"
      ELSE 'EN_ROUTE'::"DisasterAssignmentStatus"
    END
  );

ALTER TABLE "disaster_ambulance_assignments" ALTER COLUMN "status" SET DEFAULT 'EN_ROUTE'::"DisasterAssignmentStatus";

-- Step 4: Add FK for destination_hospital_id
DO $$ BEGIN
  ALTER TABLE "disaster_ambulance_assignments" ADD CONSTRAINT "disaster_ambulance_assignments_destination_hospital_id_fkey"
    FOREIGN KEY ("destination_hospital_id") REFERENCES "hospitals"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
