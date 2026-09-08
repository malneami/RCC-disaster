-- Add triage_category column to disaster_ambulance_assignments for MCI START triage
ALTER TABLE "disaster_ambulance_assignments" ADD COLUMN IF NOT EXISTS "triage_category" "TriageColorCode";
