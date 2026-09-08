-- Neurosurgical KPI target model: CT location + door-out / RCC activation

DO $$ BEGIN
  CREATE TYPE "NeurosurgicalCtLocation" AS ENUM ('ORIGIN', 'DESTINATION');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "neurosurgical_cases" ADD COLUMN IF NOT EXISTS "door_out_time" TIMESTAMP(3);
ALTER TABLE "neurosurgical_cases" ADD COLUMN IF NOT EXISTS "rcc_activation_time" TIMESTAMP(3);
ALTER TABLE "neurosurgical_cases" ADD COLUMN IF NOT EXISTS "ct_location" "NeurosurgicalCtLocation";
ALTER TABLE "neurosurgical_cases" ADD COLUMN IF NOT EXISTS "door_out_to_definitive_care_minutes" INTEGER;
