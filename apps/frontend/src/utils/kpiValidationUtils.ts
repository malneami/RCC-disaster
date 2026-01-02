import dayjs, { Dayjs } from "dayjs";

export const KPI_LIMITS = {
  ADMISSION_TO_TRIAGE: 30, // minutes
  TRANSFER_REQUEST_TO_ARRIVAL: 360, // 6 hours in minutes
  DOOR_TO_NEEDLE: 30, // minutes
  DOOR_TO_BALLOON: 90, // minutes
  ADMISSION_TO_ASSESSMENT: 30, // minutes (Stroke: Admission -> Physician Assessment)
};

export interface KpiViolation {
  percentageOver: number;
  message: string;
}

export const calculateKpiViolation = (
  start: Dayjs | Date | string | null | undefined,
  end: Dayjs | Date | string | null | undefined,
  limitMinutes: number
): KpiViolation | null => {
  if (!start || !end) return null;

  const startDate = dayjs(start);
  const endDate = dayjs(end);

  if (!startDate.isValid() || !endDate.isValid()) return null;

  const diffMinutes = endDate.diff(startDate, "minute");

  // If diffMinutes is negative, it means End is before Start (Timeline sequence error)
  // The user wants this to be flagged as a KPI violation (or at least caught)
  if (diffMinutes < 0) {
    return {
      percentageOver: 0, // Undefined/Applicable
      message: 'Timeline sequence error: End time cannot be before Start time',
    };
  }

  if (diffMinutes <= limitMinutes) return null;

  // Calculate percentage over the limit
  // Formula: ((Actual - Limit) / Limit) * 100
  const excess = diffMinutes - limitMinutes;
  const percentageOver = Math.round((excess / limitMinutes) * 100);

  return {
    percentageOver,
    message: `Results is ${percentageOver}% over the KPI limit`,
  };
};
