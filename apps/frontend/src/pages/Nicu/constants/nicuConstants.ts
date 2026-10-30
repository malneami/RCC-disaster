import type {
  NeonatalTransferStatus,
  NeonatalAcuityLevel,
  NicuLevel,
  NicuCotType,
  NeonatalRespiratorySupport,
  NeonatalAcceptanceStatus,
  NeonatalTransportTeam,
} from '../../../services/neonatalTransferService';

export interface BilingualLabel {
  en: string;
  ar: string;
}

export const STATUS_LABELS: Record<NeonatalTransferStatus, BilingualLabel> = {
  CREATED: { en: 'Created', ar: 'تم الإنشاء' },
  ACTIVATED: { en: 'Activated', ar: 'مُفعّل' },
  NEONATOLOGIST_CONNECTED: { en: 'Neonatologist Connected', ar: 'تم التواصل مع أخصائي حديثي الولادة' },
  DECISION_MADE: { en: 'Decision Made', ar: 'تم اتخاذ القرار' },
  DISPATCHED: { en: 'Dispatched', ar: 'تم الإرسال' },
  DEPARTED: { en: 'Departed', ar: 'غادر' },
  ARRIVED: { en: 'Arrived', ar: 'وصل' },
  CLOSED: { en: 'Closed', ar: 'مُغلق' },
};

export const ACUITY_LABELS: Record<NeonatalAcuityLevel, BilingualLabel> = {
  RED: { en: 'Red — Unstable / Ventilated', ar: 'أحمر — غير مستقر / تنفس صناعي' },
  ORANGE: { en: 'Orange — High acuity', ar: 'برتقالي — حرج' },
  YELLOW: { en: 'Yellow — Stable monitoring', ar: 'أصفر — مراقبة مستقرة' },
};

export const ACUITY_COLORS: Record<NeonatalAcuityLevel, 'error' | 'warning' | 'success'> = {
  RED: 'error',
  ORANGE: 'warning',
  YELLOW: 'success',
};

export const NICU_LEVEL_LABELS: Record<NicuLevel, BilingualLabel> = {
  LEVEL_I: { en: 'Level I', ar: 'المستوى الأول' },
  LEVEL_II: { en: 'Level II', ar: 'المستوى الثاني' },
  LEVEL_III: { en: 'Level III', ar: 'المستوى الثالث' },
};

export const COT_TYPE_LABELS: Record<NicuCotType, BilingualLabel> = {
  INCUBATOR: { en: 'Incubator', ar: 'حاضنة' },
  OPEN_WARMER: { en: 'Open Warmer', ar: 'سرير دافئ مفتوح' },
  VENTILATED: { en: 'Ventilated Cot', ar: 'سرير بجهاز تنفس' },
};

export const RESP_SUPPORT_LABELS: Record<NeonatalRespiratorySupport, BilingualLabel> = {
  ROOM_AIR: { en: 'Room Air', ar: 'هواء الغرفة' },
  LOW_FLOW: { en: 'Low-flow O₂', ar: 'أكسجين منخفض التدفق' },
  HIGH_FLOW: { en: 'High-flow O₂', ar: 'أكسجين عالي التدفق' },
  CPAP: { en: 'CPAP', ar: 'ضغط إيجابي مستمر' },
  NIPPV: { en: 'NIPPV', ar: 'تهوية أنفية متقطعة' },
  INVASIVE_VENT: { en: 'Invasive Ventilation', ar: 'تهوية باضعة' },
  HFOV: { en: 'HFOV', ar: 'تهوية تذبذبية عالية التردد' },
};

export const ACCEPTANCE_LABELS: Record<NeonatalAcceptanceStatus, BilingualLabel> = {
  PENDING: { en: 'Pending', ar: 'قيد الانتظار' },
  ACCEPTED: { en: 'Accepted', ar: 'مقبول' },
  DECLINED: { en: 'Declined', ar: 'مرفوض' },
};

export const TRANSPORT_TEAM_LABELS: Record<NeonatalTransportTeam, BilingualLabel> = {
  NEONATAL_RETRIEVAL: { en: 'Neonatal Retrieval Team', ar: 'فريق نقل حديثي الولادة' },
  ALS: { en: 'ALS Ambulance', ar: 'إسعاف دعم حياة متقدم' },
  BLS: { en: 'BLS Ambulance', ar: 'إسعاف دعم حياة أساسي' },
  AIR: { en: 'Air Transport', ar: 'نقل جوي' },
};

export const SUSPECTED_CONDITIONS: BilingualLabel[] = [
  { en: 'Respiratory Distress Syndrome (RDS)', ar: 'متلازمة الضائقة التنفسية' },
  { en: 'Suspected Sepsis', ar: 'اشتباه إنتان' },
  { en: 'Necrotizing Enterocolitis (NEC)', ar: 'التهاب الأمعاء والقولون الناخر' },
  { en: 'Hypoxic-Ischemic Encephalopathy (HIE)', ar: 'اعتلال دماغي نقص تأكسج' },
  { en: 'Duct-dependent cardiac lesion', ar: 'آفة قلبية معتمدة على القناة الشريانية' },
  { en: 'Surgical abdomen', ar: 'بطن جراحي' },
  { en: 'Congenital anomaly', ar: 'تشوه خلقي' },
  { en: 'Prematurity', ar: 'الخداج' },
  { en: 'Hypoglycemia', ar: 'نقص سكر الدم' },
  { en: 'Jaundice / hyperbilirubinemia', ar: 'يرقان / فرط بيليروبين' },
];

export const STABILIZATION_STEPS: BilingualLabel[] = [
  { en: 'Airway secured', ar: 'تأمين المجرى الهوائي' },
  { en: 'Thermoregulation (warmer/incubator)', ar: 'تنظيم الحرارة' },
  { en: 'IV access established', ar: 'تأمين خط وريدي' },
  { en: 'Surfactant administered', ar: 'إعطاء السيرفاكتانت' },
  { en: 'Antibiotics started', ar: 'بدء المضادات الحيوية' },
  { en: 'Glucose corrected', ar: 'تصحيح السكر' },
  { en: 'Prostaglandin started', ar: 'بدء البروستاغلاندين' },
];

export function label(l: BilingualLabel): string {
  return `${l.en} · ${l.ar}`;
}
