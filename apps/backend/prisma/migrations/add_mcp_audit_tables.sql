-- MCP Data Quality Audit tables

CREATE TYPE "AuditDimension" AS ENUM (
  'COMPLETENESS',
  'ACCURACY',
  'CONSISTENCY',
  'TIMELINESS',
  'COMPLIANCE',
  'INTEGRITY'
);

CREATE TYPE "AuditEventType" AS ENUM (
  'SCHEDULED_AUDIT',
  'REAL_TIME_EVENT',
  'MANUAL_TRIGGER',
  'SYSTEM_CHECK'
);

CREATE TYPE "AuditSeverity" AS ENUM (
  'INFO',
  'WARNING',
  'ERROR',
  'CRITICAL'
);

CREATE TABLE "audit_events" (
  "id" TEXT NOT NULL,
  "event_type" "AuditEventType" NOT NULL,
  "dimension" "AuditDimension" NOT NULL,
  "entity_type" TEXT NOT NULL,
  "entity_id" TEXT NOT NULL,
  "severity" "AuditSeverity" NOT NULL,
  "description" TEXT NOT NULL,
  "details" JSONB,
  "mcp_submitted" BOOLEAN NOT NULL DEFAULT false,
  "mcp_response" JSONB,
  "mcp_submitted_at" TIMESTAMP(3),
  "created_by_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "audit_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "audit_reports" (
  "id" TEXT NOT NULL,
  "report_number" TEXT NOT NULL,
  "report_type" TEXT NOT NULL,
  "start_date" TIMESTAMP(3) NOT NULL,
  "end_date" TIMESTAMP(3) NOT NULL,
  "overall_score" DOUBLE PRECISION NOT NULL,
  "dimension_scores" JSONB NOT NULL,
  "summary" JSONB NOT NULL,
  "mcp_report_url" TEXT,
  "generated_by_id" TEXT,
  "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "audit_reports_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "audit_reports_report_number_key" ON "audit_reports"("report_number");

CREATE INDEX "audit_events_event_type_idx" ON "audit_events"("event_type");
CREATE INDEX "audit_events_dimension_idx" ON "audit_events"("dimension");
CREATE INDEX "audit_events_severity_idx" ON "audit_events"("severity");
CREATE INDEX "audit_events_entity_type_idx" ON "audit_events"("entity_type");
CREATE INDEX "audit_events_created_at_idx" ON "audit_events"("created_at");
CREATE INDEX "audit_events_created_by_id_idx" ON "audit_events"("created_by_id");

CREATE INDEX "audit_reports_report_type_idx" ON "audit_reports"("report_type");
CREATE INDEX "audit_reports_generated_at_idx" ON "audit_reports"("generated_at");
CREATE INDEX "audit_reports_generated_by_id_idx" ON "audit_reports"("generated_by_id");

ALTER TABLE "audit_events"
  ADD CONSTRAINT "audit_events_created_by_id_fkey"
  FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "audit_reports"
  ADD CONSTRAINT "audit_reports_generated_by_id_fkey"
  FOREIGN KEY ("generated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
