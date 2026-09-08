import { Injectable } from '@nestjs/common';
import {
  NeurosurgicalCase,
  NeurosurgicalCaseStatus,
  NeurosurgicalCtLocation,
  NeurosurgicalOutcome,
} from '@prisma/client';

/**
 * Locked targets (minutes) — keep in sync with frontend neuroConfig.ts
 *
 * CT at origin (hospital with CT):
 *   Door → CT start ≤15, Door → CT report ≤30
 * CT at destination (transfer):
 *   Door(origin) → CT start ≤30, Door(origin) → CT report ≤35
 * Activation (RCC call) → Neurosurgeon decision ≤15
 * Door out (origin) → Definitive care (destination) ≤30
 */
export const NEURO_KPI_TARGETS = {
  DOOR_TO_CT_ORIGIN: 15,
  DOOR_TO_CT_REPORT_ORIGIN: 30,
  DOOR_TO_CT_DESTINATION: 30,
  DOOR_TO_CT_REPORT_DESTINATION: 35,
  RCC_TO_NEUROSURGEON_DECISION: 15,
  DOOR_OUT_TO_DEFINITIVE_CARE: 30,
} as const;

export interface NeurosurgicalKPICalculations {
  doorToCtMinutes?: number | null;
  doorToCtReportMinutes?: number | null;
  activationToNeurosurgeonMinutes?: number | null;
  doorOutToDefinitiveCareMinutes?: number | null;
  /** @deprecated mirrored for older aggregate code */
  activationToDefinitiveCareMinutes?: number | null;
  metKpi1?: boolean | null;
  metKpi2?: boolean | null;
  metKpi3?: boolean | null;
  metKpi4?: boolean | null;
  metKpi5?: boolean | null;
  metKpi6?: boolean | null;
  brainPreserved?: boolean | null;
}

type NeuroCaseForKpi = Pick<
  NeurosurgicalCase,
  | 'activatedAt'
  | 'doorTime'
  | 'doorOutTime'
  | 'rccActivationTime'
  | 'ctLocation'
  | 'ctScanStartTime'
  | 'ctReportFinalTime'
  | 'neurosurgeonConnectedAt'
  | 'definitiveCareReachedAt'
  | 'status'
  | 'neurologicalOutcome'
  | 'deteriorationDuringTransfer'
  | 'cardiacArrestDuringTransfer'
  | 'unplannedIntubation'
  | 'delayedIntervention'
  | 'wrongDestination'
>;

@Injectable()
export class NeurosurgicalKPICalculatorService {
  getCtTargets(ctLocation: NeurosurgicalCtLocation | null | undefined): {
    doorToCt: number;
    doorToCtReport: number;
  } | null {
    if (ctLocation === NeurosurgicalCtLocation.ORIGIN) {
      return {
        doorToCt: NEURO_KPI_TARGETS.DOOR_TO_CT_ORIGIN,
        doorToCtReport: NEURO_KPI_TARGETS.DOOR_TO_CT_REPORT_ORIGIN,
      };
    }
    if (ctLocation === NeurosurgicalCtLocation.DESTINATION) {
      return {
        doorToCt: NEURO_KPI_TARGETS.DOOR_TO_CT_DESTINATION,
        doorToCtReport: NEURO_KPI_TARGETS.DOOR_TO_CT_REPORT_DESTINATION,
      };
    }
    return null;
  }

  calculateKPIs(neuroCase: NeuroCaseForKpi): NeurosurgicalKPICalculations {
    const doorToCtMinutes = this.diffMinutes(neuroCase.doorTime, neuroCase.ctScanStartTime);
    const doorToCtReportMinutes = this.diffMinutes(
      neuroCase.doorTime,
      neuroCase.ctReportFinalTime,
    );

    const rccStart = neuroCase.rccActivationTime ?? neuroCase.activatedAt;
    const activationToNeurosurgeonMinutes = this.diffMinutes(
      rccStart,
      neuroCase.neurosurgeonConnectedAt,
    );

    const doorOutToDefinitiveCareMinutes = this.diffMinutes(
      neuroCase.doorOutTime,
      neuroCase.definitiveCareReachedAt,
    );

    const ctTargets = this.getCtTargets(neuroCase.ctLocation);

    // KPI1/2 N/A until CT location is set
    const metKpi1 =
      ctTargets && doorToCtMinutes !== undefined
        ? doorToCtMinutes <= ctTargets.doorToCt
        : null;
    const metKpi2 =
      ctTargets && doorToCtReportMinutes !== undefined
        ? doorToCtReportMinutes <= ctTargets.doorToCtReport
        : null;

    const isClosed = neuroCase.status === NeurosurgicalCaseStatus.CLOSED;
    const brainPreserved = isClosed ? this.calculateBrainPreserved(neuroCase) : null;
    const metKpi6 = isClosed
      ? !neuroCase.delayedIntervention && !neuroCase.wrongDestination
      : null;

    return {
      doorToCtMinutes: doorToCtMinutes ?? null,
      doorToCtReportMinutes: doorToCtReportMinutes ?? null,
      activationToNeurosurgeonMinutes: activationToNeurosurgeonMinutes ?? null,
      doorOutToDefinitiveCareMinutes: doorOutToDefinitiveCareMinutes ?? null,
      activationToDefinitiveCareMinutes: doorOutToDefinitiveCareMinutes ?? null,
      metKpi1,
      metKpi2,
      metKpi3:
        activationToNeurosurgeonMinutes !== undefined
          ? activationToNeurosurgeonMinutes <=
            NEURO_KPI_TARGETS.RCC_TO_NEUROSURGEON_DECISION
          : null,
      metKpi4:
        doorOutToDefinitiveCareMinutes !== undefined
          ? doorOutToDefinitiveCareMinutes <=
            NEURO_KPI_TARGETS.DOOR_OUT_TO_DEFINITIVE_CARE
          : null,
      metKpi5: brainPreserved,
      metKpi6,
      brainPreserved,
    };
  }

  private calculateBrainPreserved(neuroCase: NeuroCaseForKpi): boolean {
    const outcomeOk =
      neuroCase.neurologicalOutcome === NeurosurgicalOutcome.IMPROVED ||
      neuroCase.neurologicalOutcome === NeurosurgicalOutcome.STABLE;
    return (
      outcomeOk &&
      !neuroCase.deteriorationDuringTransfer &&
      !neuroCase.cardiacArrestDuringTransfer &&
      !neuroCase.unplannedIntubation
    );
  }

  private diffMinutes(
    start: Date | string | null | undefined,
    end: Date | string | null | undefined,
  ): number | undefined {
    if (!start || !end) return undefined;
    const startMs = new Date(start).getTime();
    const endMs = new Date(end).getTime();
    if (Number.isNaN(startMs) || Number.isNaN(endMs)) return undefined;
    const minutes = Math.round((endMs - startMs) / 60000);
    if (minutes < 0 || minutes > 1440) return undefined;
    return minutes;
  }
}
