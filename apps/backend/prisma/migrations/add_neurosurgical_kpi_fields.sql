-- Neurosurgical pathway KPI timestamps and stored metrics

ALTER TABLE "neurosurgical_cases" ADD COLUMN IF NOT EXISTS "door_time" TIMESTAMP(3);
ALTER TABLE "neurosurgical_cases" ADD COLUMN IF NOT EXISTS "ct_scan_start_time" TIMESTAMP(3);
ALTER TABLE "neurosurgical_cases" ADD COLUMN IF NOT EXISTS "ct_report_final_time" TIMESTAMP(3);
ALTER TABLE "neurosurgical_cases" ADD COLUMN IF NOT EXISTS "neurosurgeon_notified_at" TIMESTAMP(3);
ALTER TABLE "neurosurgical_cases" ADD COLUMN IF NOT EXISTS "neurosurgeon_connected_at" TIMESTAMP(3);

ALTER TABLE "neurosurgical_cases" ADD COLUMN IF NOT EXISTS "door_to_ct_minutes" INTEGER;
ALTER TABLE "neurosurgical_cases" ADD COLUMN IF NOT EXISTS "door_to_ct_report_minutes" INTEGER;
ALTER TABLE "neurosurgical_cases" ADD COLUMN IF NOT EXISTS "activation_to_neurosurgeon_minutes" INTEGER;
ALTER TABLE "neurosurgical_cases" ADD COLUMN IF NOT EXISTS "activation_to_definitive_care_minutes" INTEGER;

ALTER TABLE "neurosurgical_cases" ADD COLUMN IF NOT EXISTS "met_kpi1" BOOLEAN;
ALTER TABLE "neurosurgical_cases" ADD COLUMN IF NOT EXISTS "met_kpi2" BOOLEAN;
ALTER TABLE "neurosurgical_cases" ADD COLUMN IF NOT EXISTS "met_kpi3" BOOLEAN;
ALTER TABLE "neurosurgical_cases" ADD COLUMN IF NOT EXISTS "met_kpi4" BOOLEAN;
ALTER TABLE "neurosurgical_cases" ADD COLUMN IF NOT EXISTS "met_kpi5" BOOLEAN;
ALTER TABLE "neurosurgical_cases" ADD COLUMN IF NOT EXISTS "met_kpi6" BOOLEAN;
ALTER TABLE "neurosurgical_cases" ADD COLUMN IF NOT EXISTS "brain_preserved" BOOLEAN;
