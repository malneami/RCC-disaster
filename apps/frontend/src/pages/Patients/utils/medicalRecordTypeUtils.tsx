import React from 'react';
import {
  LocalHospital,
  Science,
  Image,
  Healing,
  Medication,
  Vaccines,
  Warning,
  MonitorHeart,
  LocalHospital as EmergencyIcon,
  Assignment,
  Send,
  ExitToApp,
  HelpOutline,
} from '@mui/icons-material';
import { MedicalRecordType } from '../../../services/medicalRecordService';

export const getRecordTypeColor = (type: MedicalRecordType): string => {
  const colorMap: Record<MedicalRecordType, string> = {
    CONSULTATION: '#42a5f5',
    LABORATORY: '#26a69a',
    RADIOLOGY: '#7e57c2',
    SURGERY: '#ef5350',
    MEDICATION: '#66bb6a',
    VACCINATION: '#ff9800',
    ALLERGY: '#ec407a',
    CHRONIC_CONDITION: '#ab47bc',
    EMERGENCY_VISIT: '#c62828',
    FOLLOW_UP: '#5c6bc0',
    REFERRAL: '#00acc1',
    DISCHARGE: '#78909c',
    OTHER: '#9e9e9e',
  };
  return colorMap[type] || '#9e9e9e';
};

export const getRecordTypeIcon = (type: MedicalRecordType): React.ReactNode => {
  const iconMap: Record<MedicalRecordType, React.ReactNode> = {
    CONSULTATION: <LocalHospital sx={{ fontSize: '20px' }} />,
    LABORATORY: <Science sx={{ fontSize: '20px' }} />,
    RADIOLOGY: <Image sx={{ fontSize: '20px' }} />,
    SURGERY: <Healing sx={{ fontSize: '20px' }} />,
    MEDICATION: <Medication sx={{ fontSize: '20px' }} />,
    VACCINATION: <Vaccines sx={{ fontSize: '20px' }} />,
    ALLERGY: <Warning sx={{ fontSize: '20px' }} />,
    CHRONIC_CONDITION: <MonitorHeart sx={{ fontSize: '20px' }} />,
    EMERGENCY_VISIT: <EmergencyIcon sx={{ fontSize: '20px' }} />,
    FOLLOW_UP: <Assignment sx={{ fontSize: '20px' }} />,
    REFERRAL: <Send sx={{ fontSize: '20px' }} />,
    DISCHARGE: <ExitToApp sx={{ fontSize: '20px' }} />,
    OTHER: <HelpOutline sx={{ fontSize: '20px' }} />,
  };
  return iconMap[type] || <HelpOutline sx={{ fontSize: '20px' }} />;
};

export const getRecordTypeLabel = (type: MedicalRecordType): string => {
  const labelMap: Record<MedicalRecordType, string> = {
    CONSULTATION: 'Consultation',
    LABORATORY: 'Laboratory',
    RADIOLOGY: 'Radiology',
    SURGERY: 'Surgery',
    MEDICATION: 'Medication',
    VACCINATION: 'Vaccination',
    ALLERGY: 'Allergy',
    CHRONIC_CONDITION: 'Chronic Condition',
    EMERGENCY_VISIT: 'Emergency Visit',
    FOLLOW_UP: 'Follow Up',
    REFERRAL: 'Referral',
    DISCHARGE: 'Discharge',
    OTHER: 'Other',
  };
  return labelMap[type] || 'Other';
};

