-- Add DisasterScope enum
DO $$ BEGIN
  CREATE TYPE "DisasterScope" AS ENUM ('INTERNAL', 'EXTERNAL');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add new values to DisasterIncidentType enum
ALTER TYPE "DisasterIncidentType" ADD VALUE IF NOT EXISTS 'INTERNAL_FIRE';
ALTER TYPE "DisasterIncidentType" ADD VALUE IF NOT EXISTS 'SMOKE_ELECTRICAL_FAILURE';
ALTER TYPE "DisasterIncidentType" ADD VALUE IF NOT EXISTS 'POWER_FAILURE';
ALTER TYPE "DisasterIncidentType" ADD VALUE IF NOT EXISTS 'WATER_LEAKAGE_FLOODING';
ALTER TYPE "DisasterIncidentType" ADD VALUE IF NOT EXISTS 'IT_SYSTEM_FAILURE';

-- Add disaster_scope column with default EXTERNAL
ALTER TABLE "disaster_incidents"
  ADD COLUMN IF NOT EXISTS "disaster_scope" "DisasterScope" NOT NULL DEFAULT 'EXTERNAL';
