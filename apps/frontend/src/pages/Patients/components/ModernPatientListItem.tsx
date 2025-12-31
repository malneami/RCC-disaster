import React from 'react';
import { Box } from '@mui/material';
import { Patient } from '../../../services/patientService';
import PatientAvatar from './list-item/PatientAvatar';
import PatientInfo from './list-item/PatientInfo';
import PatientContactInfo from './list-item/PatientContactInfo';
import PatientActions from './list-item/PatientActions';
import { getPrivacyLevelColor, AVATAR_COLORS } from './list-item/ListItemConstants';

interface ModernPatientListItemProps {
  patient: Patient;
  index: number;
  onViewPatient: (patient: Patient) => void;
  onEditPatient: (patient: Patient) => void;
  onExportPatient: (patient: Patient) => void;
}

const ModernPatientListItem: React.FC<ModernPatientListItemProps> = ({
  patient,
  index,
  onViewPatient,
  onEditPatient,
  onExportPatient,
}) => {
  const privacyColors = getPrivacyLevelColor(patient.privacyLevel);
  const isEven = index % 2 === 0;

  const avatarColor = AVATAR_COLORS[index % AVATAR_COLORS.length];

  return (
    <Box
      sx={{
        position: 'relative',
        background: isEven
          ? 'linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%)'
          : 'linear-gradient(135deg, #fafafa 0%, #f5f7ff 100%)',
        borderRadius: '14px',
        padding: '22px 26px',
        marginBottom: '14px',
        border: '1px solid',
        borderColor: 'rgba(79, 172, 254, 0.12)',
        boxShadow: '0 3px 12px rgba(79, 172, 254, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: 'pointer',
        '&:hover': {
          transform: 'translateY(-3px)',
          boxShadow: '0 8px 24px rgba(79, 172, 254, 0.15), 0 4px 8px rgba(0, 0, 0, 0.06)',
          background: isEven
            ? 'linear-gradient(135deg, #ffffff 0%, #e8f4ff 100%)'
            : 'linear-gradient(135deg, #fafafa 0%, #e3f2fd 100%)',
          borderColor: 'rgba(79, 172, 254, 0.25)',
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: '4px',
          background: avatarColor.bg,
          borderRadius: '14px 0 0 14px',
          opacity: 0,
          transition: 'opacity 0.3s ease, width 0.3s ease',
        },
        '&:hover::before': {
          opacity: 1,
          width: '5px',
        },
      }}
      onClick={() => onViewPatient(patient)}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 3,
        }}
      >
        {/* Left Section - Patient Info */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
          <PatientAvatar patient={patient} avatarColor={avatarColor} />

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <PatientInfo patient={patient} privacyColors={privacyColors} />
            <PatientContactInfo patient={patient} />
          </Box>
        </Box>

        {/* Right Section - Actions */}
        <PatientActions
          patient={patient}
          onViewPatient={onViewPatient}
          onEditPatient={onEditPatient}
          onExportPatient={onExportPatient}
        />
      </Box>
    </Box>
  );
};

export default ModernPatientListItem;
