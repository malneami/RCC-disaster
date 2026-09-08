-- Neurosurgical Mini Pathway tables and enums

ALTER TYPE "TicketPathway" ADD VALUE IF NOT EXISTS 'NEUROSURGICAL';

CREATE TYPE "NeurosurgicalTriggerReason" AS ENUM (
  'TRAUMATIC_BRAIN_INJURY',
  'INTRACRANIAL_HEMORRHAGE',
  'SUBDURAL_HEMATOMA',
  'EPIDURAL_HEMATOMA',
  'SUBARACHNOID_HEMORRHAGE',
  'DEPRESSED_SKULL_FRACTURE',
  'HYDROCEPHALUS',
  'SPINAL_CORD_INJURY',
  'SPINAL_COMPRESSION',
  'INTRACRANIAL_MASS_RAISED_ICP',
  'POSTOPERATIVE_COMPLICATION',
  'OTHER'
);

CREATE TYPE "NeurosurgicalSeverity" AS ENUM ('RED', 'ORANGE');

CREATE TYPE "NeurosurgicalPupils" AS ENUM ('EQUAL', 'UNEQUAL', 'FIXED');

CREATE TYPE "NeurosurgicalGcsTrend" AS ENUM ('IMPROVING', 'STABLE', 'DETERIORATING');

CREATE TYPE "NeurosurgicalDisposition" AS ENUM (
  'OPERATING_ROOM',
  'ICU',
  'OBSERVATION',
  'CONSERVATIVE',
  'NO_INTERVENTION'
);

CREATE TYPE "NeurosurgicalOutcome" AS ENUM (
  'IMPROVED',
  'STABLE',
  'DETERIORATED',
  'SEVERE_DISABILITY',
  'DEATH'
);

CREATE TYPE "NeurosurgicalDefinitiveTreatment" AS ENUM (
  'SURGERY',
  'ICU_MANAGEMENT',
  'CONSERVATIVE_TREATMENT',
  'NO_NEUROSURGICAL_INTERVENTION'
);

CREATE TYPE "NeurosurgicalCaseStatus" AS ENUM (
  'ACTIVE',
  'DEFINITIVE_CARE_REACHED',
  'CLOSED'
);

ALTER TABLE "hospitals" ADD COLUMN IF NOT EXISTS "has_neurosurgery_service" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS "neurosurgical_cases" (
  "id" TEXT NOT NULL,
  "ticket_id" TEXT NOT NULL,
  "patient_id" TEXT NOT NULL,
  "created_by_id" TEXT NOT NULL,
  "origin_hospital_id" TEXT NOT NULL,
  "destination_hospital_id" TEXT,
  "status" "NeurosurgicalCaseStatus" NOT NULL DEFAULT 'ACTIVE',
  "activated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "trigger_reason" "NeurosurgicalTriggerReason" NOT NULL,
  "trigger_reason_other" TEXT,
  "gcs" INTEGER,
  "gcs_trend" "NeurosurgicalGcsTrend",
  "pupils" "NeurosurgicalPupils",
  "new_focal_deficit" BOOLEAN NOT NULL DEFAULT false,
  "seizure" BOOLEAN NOT NULL DEFAULT false,
  "intubated" BOOLEAN NOT NULL DEFAULT false,
  "hemodynamic_instability" BOOLEAN NOT NULL DEFAULT false,
  "anticoagulant_use" BOOLEAN NOT NULL DEFAULT false,
  "mechanism_of_injury" TEXT,
  "severity" "NeurosurgicalSeverity" NOT NULL,
  "severity_override_reason" TEXT,
  "definitive_disposition" "NeurosurgicalDisposition",
  "disposition_detail" JSONB,
  "definitive_care_reached_at" TIMESTAMP(3),
  "neurological_outcome" "NeurosurgicalOutcome",
  "definitive_treatment" "NeurosurgicalDefinitiveTreatment",
  "deterioration_during_transfer" BOOLEAN NOT NULL DEFAULT false,
  "cardiac_arrest_during_transfer" BOOLEAN NOT NULL DEFAULT false,
  "unplanned_intubation" BOOLEAN NOT NULL DEFAULT false,
  "delayed_intervention" BOOLEAN NOT NULL DEFAULT false,
  "wrong_destination" BOOLEAN NOT NULL DEFAULT false,
  "repeat_transfer_required" BOOLEAN NOT NULL DEFAULT false,
  "review_flag" BOOLEAN NOT NULL DEFAULT false,
  "closed_at" TIMESTAMP(3),
  "closed_by_id" TEXT,
  "notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "neurosurgical_cases_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "neurosurgical_cases_ticket_id_key" ON "neurosurgical_cases"("ticket_id");
CREATE INDEX IF NOT EXISTS "neurosurgical_cases_patient_id_idx" ON "neurosurgical_cases"("patient_id");
CREATE INDEX IF NOT EXISTS "neurosurgical_cases_status_idx" ON "neurosurgical_cases"("status");
CREATE INDEX IF NOT EXISTS "neurosurgical_cases_severity_idx" ON "neurosurgical_cases"("severity");
CREATE INDEX IF NOT EXISTS "neurosurgical_cases_origin_hospital_id_idx" ON "neurosurgical_cases"("origin_hospital_id");
CREATE INDEX IF NOT EXISTS "neurosurgical_cases_destination_hospital_id_idx" ON "neurosurgical_cases"("destination_hospital_id");
CREATE INDEX IF NOT EXISTS "neurosurgical_cases_activated_at_idx" ON "neurosurgical_cases"("activated_at");
CREATE INDEX IF NOT EXISTS "neurosurgical_cases_created_at_idx" ON "neurosurgical_cases"("created_at");
CREATE INDEX IF NOT EXISTS "hospitals_has_neurosurgery_service_idx" ON "hospitals"("has_neurosurgery_service");

ALTER TABLE "neurosurgical_cases"
  ADD CONSTRAINT "neurosurgical_cases_ticket_id_fkey"
  FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "neurosurgical_cases"
  ADD CONSTRAINT "neurosurgical_cases_patient_id_fkey"
  FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "neurosurgical_cases"
  ADD CONSTRAINT "neurosurgical_cases_created_by_id_fkey"
  FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "neurosurgical_cases"
  ADD CONSTRAINT "neurosurgical_cases_closed_by_id_fkey"
  FOREIGN KEY ("closed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "neurosurgical_cases"
  ADD CONSTRAINT "neurosurgical_cases_origin_hospital_id_fkey"
  FOREIGN KEY ("origin_hospital_id") REFERENCES "hospitals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "neurosurgical_cases"
  ADD CONSTRAINT "neurosurgical_cases_destination_hospital_id_fkey"
  FOREIGN KEY ("destination_hospital_id") REFERENCES "hospitals"("id") ON DELETE SET NULL ON UPDATE CASCADE;
