-- Add DisasterNotificationType enum
DO $$ BEGIN
  CREATE TYPE "DisasterNotificationType" AS ENUM (
    'INCIDENT_CREATED',
    'ANNOUNCEMENT_SENT',
    'AMBULANCE_ASSIGNED',
    'INCIDENT_RESOLVED'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add DisasterNotificationStatus enum
DO $$ BEGIN
  CREATE TYPE "DisasterNotificationStatus" AS ENUM ('UNREAD', 'READ');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create disaster_notifications table
CREATE TABLE IF NOT EXISTS "disaster_notifications" (
  "id" TEXT NOT NULL,
  "disaster_incident_id" TEXT NOT NULL,
  "type" "DisasterNotificationType" NOT NULL,
  "priority" "NotificationPriority" NOT NULL,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "status" "DisasterNotificationStatus" NOT NULL DEFAULT 'UNREAD',
  "created_by_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "disaster_notifications_pkey" PRIMARY KEY ("id")
);

-- Create disaster_notification_recipients table
CREATE TABLE IF NOT EXISTS "disaster_notification_recipients" (
  "id" TEXT NOT NULL,
  "notification_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "is_read" BOOLEAN NOT NULL DEFAULT false,
  "read_at" TIMESTAMP(3),
  "delivery_method" "DeliveryMethod" NOT NULL DEFAULT 'IN_APP',

  CONSTRAINT "disaster_notification_recipients_pkey" PRIMARY KEY ("id")
);

-- Create disaster_messages table
CREATE TABLE IF NOT EXISTS "disaster_messages" (
  "id" TEXT NOT NULL,
  "disaster_incident_id" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "created_by_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "disaster_messages_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint on disaster_notification_recipients
CREATE UNIQUE INDEX IF NOT EXISTS "disaster_notification_recipients_notification_id_user_id_key"
  ON "disaster_notification_recipients"("notification_id", "user_id");

-- Create indexes for disaster_notifications
CREATE INDEX IF NOT EXISTS "disaster_notifications_disaster_incident_id_idx"
  ON "disaster_notifications"("disaster_incident_id");
CREATE INDEX IF NOT EXISTS "disaster_notifications_created_by_id_idx"
  ON "disaster_notifications"("created_by_id");
CREATE INDEX IF NOT EXISTS "disaster_notifications_created_at_idx"
  ON "disaster_notifications"("created_at");
CREATE INDEX IF NOT EXISTS "disaster_notifications_type_idx"
  ON "disaster_notifications"("type");
CREATE INDEX IF NOT EXISTS "disaster_notifications_status_idx"
  ON "disaster_notifications"("status");

-- Create indexes for disaster_notification_recipients
CREATE INDEX IF NOT EXISTS "disaster_notification_recipients_notification_id_idx"
  ON "disaster_notification_recipients"("notification_id");
CREATE INDEX IF NOT EXISTS "disaster_notification_recipients_user_id_idx"
  ON "disaster_notification_recipients"("user_id");
CREATE INDEX IF NOT EXISTS "disaster_notification_recipients_is_read_idx"
  ON "disaster_notification_recipients"("is_read");

-- Create indexes for disaster_messages
CREATE INDEX IF NOT EXISTS "disaster_messages_disaster_incident_id_idx"
  ON "disaster_messages"("disaster_incident_id");
CREATE INDEX IF NOT EXISTS "disaster_messages_created_by_id_idx"
  ON "disaster_messages"("created_by_id");
CREATE INDEX IF NOT EXISTS "disaster_messages_created_at_idx"
  ON "disaster_messages"("created_at");

-- Add foreign keys
ALTER TABLE "disaster_notifications"
  DROP CONSTRAINT IF EXISTS "disaster_notifications_disaster_incident_id_fkey",
  ADD CONSTRAINT "disaster_notifications_disaster_incident_id_fkey"
    FOREIGN KEY ("disaster_incident_id") REFERENCES "disaster_incidents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "disaster_notifications"
  DROP CONSTRAINT IF EXISTS "disaster_notifications_created_by_id_fkey",
  ADD CONSTRAINT "disaster_notifications_created_by_id_fkey"
    FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "disaster_notification_recipients"
  DROP CONSTRAINT IF EXISTS "disaster_notification_recipients_notification_id_fkey",
  ADD CONSTRAINT "disaster_notification_recipients_notification_id_fkey"
    FOREIGN KEY ("notification_id") REFERENCES "disaster_notifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "disaster_notification_recipients"
  DROP CONSTRAINT IF EXISTS "disaster_notification_recipients_user_id_fkey",
  ADD CONSTRAINT "disaster_notification_recipients_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "disaster_messages"
  DROP CONSTRAINT IF EXISTS "disaster_messages_disaster_incident_id_fkey",
  ADD CONSTRAINT "disaster_messages_disaster_incident_id_fkey"
    FOREIGN KEY ("disaster_incident_id") REFERENCES "disaster_incidents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "disaster_messages"
  DROP CONSTRAINT IF EXISTS "disaster_messages_created_by_id_fkey",
  ADD CONSTRAINT "disaster_messages_created_by_id_fkey"
    FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
