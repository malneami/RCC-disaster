import React from 'react';
import { Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Patient } from '../../../services/patientService';
import PatientInfoSection from './ModernPatientListItem/PatientInfoSection';
import PatientActionButtons from './ModernPatientListItem/PatientActionButtons';
import { getPrivacyLevelColor, avatarColors } from './ModernPatientListItem/utils';

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
  onEditPatient,
  onExportPatient,
}) => {
  const navigate = useNavigate();
  const privacyColors = getPrivacyLevelColor(patient.privacyLevel);
  const isEven = index % 2 === 0;
  const avatarColor = avatarColors[index % avatarColors.length];
  const colorIndex = index % avatarColors.length;

  const handleViewPatient = () => {
    // Navigate with color index to match the list view color
    navigate(`/patients/${patient.id}?colorIndex=${colorIndex}`);
  };

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
      onClick={handleViewPatient}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 3,
        }}
      >
        <PatientInfoSection
          patient={patient}
          avatarColor={avatarColor}
          privacyColors={privacyColors}
        />
        <PatientActionButtons
          patient={patient}
          onViewPatient={handleViewPatient}
          onEditPatient={onEditPatient}
          onExportPatient={onExportPatient}
        />
      </Box>
    </Box>
  );
};

export default ModernPatientListItem;
