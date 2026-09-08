import { DisasterCommandRole, DisasterEscalationLevel } from '@prisma/client';

/**
 * Level 1 mandatory roles – uses existing DisasterCommandRole enum, no expansion.
 * Spec: Incident Commander, EMS Coordinator, Hospital Coordinator, Recorder.
 * OPERATIONS_LEAD and SITUATION_ANALYST = optional (Pathway Lead as needed).
 */
export const LEVEL_1_REQUIRED_ROLES: DisasterCommandRole[] = [
  DisasterCommandRole.COMMANDER,
  DisasterCommandRole.EMS_COORDINATOR,
  DisasterCommandRole.HOSPITAL_COORDINATION_LEAD,
  DisasterCommandRole.RECORDER,
];

export function getRequiredRolesForLevel(level: DisasterEscalationLevel): DisasterCommandRole[] {
  if (level === DisasterEscalationLevel.LEVEL_1) {
    return [...LEVEL_1_REQUIRED_ROLES];
  }
  return [];
}
