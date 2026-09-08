-- Consolidate DisasterEscalationLevel: remove MCI and REGIONAL_CRISIS
-- Map MCI -> LEVEL_2, REGIONAL_CRISIS -> LEVEL_3

-- Create new enum with only LEVEL_1, LEVEL_2, LEVEL_3
CREATE TYPE "DisasterEscalationLevel_new" AS ENUM ('LEVEL_1', 'LEVEL_2', 'LEVEL_3');

-- Drop default before type change
ALTER TABLE "disaster_command_rooms" ALTER COLUMN "escalation_level" DROP DEFAULT;

-- Update disaster_command_rooms to use new enum (map MCI->LEVEL_2, REGIONAL_CRISIS->LEVEL_3)
ALTER TABLE "disaster_command_rooms"
  ALTER COLUMN "escalation_level" TYPE "DisasterEscalationLevel_new"
  USING (
    CASE "escalation_level"::text
      WHEN 'MCI' THEN 'LEVEL_2'::"DisasterEscalationLevel_new"
      WHEN 'REGIONAL_CRISIS' THEN 'LEVEL_3'::"DisasterEscalationLevel_new"
      ELSE "escalation_level"::text::"DisasterEscalationLevel_new"
    END
  );

-- Drop old enum and rename new one
DROP TYPE "DisasterEscalationLevel";
ALTER TYPE "DisasterEscalationLevel_new" RENAME TO "DisasterEscalationLevel";

-- Restore default
ALTER TABLE "disaster_command_rooms" ALTER COLUMN "escalation_level" SET DEFAULT 'LEVEL_1'::"DisasterEscalationLevel";
