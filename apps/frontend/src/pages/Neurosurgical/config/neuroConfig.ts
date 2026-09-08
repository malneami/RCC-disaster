export type NeurosurgicalCtLocation = 'ORIGIN' | 'DESTINATION';

export const NEURO_CONFIG = {
  KPI_TARGETS: {
    /** Hospital with CT machine (CT at origin) */
    DOOR_TO_CT_ORIGIN: 15,
    DOOR_TO_CT_REPORT_ORIGIN: 30,
    /** Transfer: CT at destination hospital */
    DOOR_TO_CT_DESTINATION: 30,
    DOOR_TO_CT_REPORT_DESTINATION: 35,
    /** Activation (call RCC) → Neurosurgeon decision */
    RCC_TO_NEUROSURGEON_DECISION: 15,
    /** Door out (origin) → Definitive care (destination) */
    DOOR_OUT_TO_DEFINITIVE_CARE: 30,
  },
  KPI_LABELS: {
    kpi1: {
      name: 'Door → CT start',
      target: '≤15 min (CT on-site) / ≤30 min (transfer)',
    },
    kpi2: {
      name: 'Door → CT report',
      target: '≤30 min (CT on-site) / ≤35 min (transfer)',
    },
    kpi3: {
      name: 'RCC call → Neurosurgeon decision',
      target: '≤15 min',
    },
    kpi4: {
      name: 'Door out → Definitive care',
      target: '≤30 min',
    },
    kpi5: { name: 'Brain preserved', target: 'Closed + stable/improved' },
    kpi6: { name: 'Transfer integrity', target: 'No delay / wrong dest' },
  },
} as const;

export function getNeuroCtTargets(ctLocation?: NeurosurgicalCtLocation | null): {
  doorToCt: number;
  doorToCtReport: number;
  label: string;
} | null {
  if (ctLocation === 'ORIGIN') {
    return {
      doorToCt: NEURO_CONFIG.KPI_TARGETS.DOOR_TO_CT_ORIGIN,
      doorToCtReport: NEURO_CONFIG.KPI_TARGETS.DOOR_TO_CT_REPORT_ORIGIN,
      label: 'CT at origin (hospital with CT)',
    };
  }
  if (ctLocation === 'DESTINATION') {
    return {
      doorToCt: NEURO_CONFIG.KPI_TARGETS.DOOR_TO_CT_DESTINATION,
      doorToCtReport: NEURO_CONFIG.KPI_TARGETS.DOOR_TO_CT_REPORT_DESTINATION,
      label: 'CT at destination (transfer)',
    };
  }
  return null;
}
