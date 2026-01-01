import React from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';
import {
  Visibility as ViewIcon,
  Edit as EditIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { Patient } from '../../../../services/patientService';

interface PatientActionButtonsProps {
  patient: Patient;
  onViewPatient: () => void;
  onEditPatient: (patient: Patient) => void;
  onExportPatient: (patient: Patient) => void;
}

const PatientActionButtons: React.FC<PatientActionButtonsProps> = ({
  patient,
  onViewPatient,
  onEditPatient,
  onExportPatient,
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        flexShrink: 0,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <Tooltip title="View Details" arrow>
        <IconButton
          size="medium"
          onClick={onViewPatient}
          sx={{
            color: '#4facfe',
            background: 'linear-gradient(135deg, rgba(79, 172, 254, 0.1) 0%, rgba(0, 242, 254, 0.1) 100%)',
            border: '1px solid rgba(79, 172, 254, 0.2)',
            '&:hover': {
              background: 'linear-gradient(135deg, rgba(79, 172, 254, 0.2) 0%, rgba(0, 242, 254, 0.2) 100%)',
              transform: 'scale(1.08)',
              boxShadow: '0 4px 12px rgba(79, 172, 254, 0.25)',
            },
            transition: 'all 0.25s ease',
          }}
        >
          <ViewIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Edit Patient" arrow>
        <IconButton
          size="medium"
          onClick={() => onEditPatient(patient)}
          sx={{
            color: '#43e97b',
            background: 'linear-gradient(135deg, rgba(67, 233, 123, 0.1) 0%, rgba(56, 249, 215, 0.1) 100%)',
            border: '1px solid rgba(67, 233, 123, 0.2)',
            '&:hover': {
              background: 'linear-gradient(135deg, rgba(67, 233, 123, 0.2) 0%, rgba(56, 249, 215, 0.2) 100%)',
              transform: 'scale(1.08)',
              boxShadow: '0 4px 12px rgba(67, 233, 123, 0.25)',
            },
            transition: 'all 0.25s ease',
          }}
        >
          <EditIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Export Patient Data" arrow>
        <IconButton
          size="medium"
          onClick={() => onExportPatient(patient)}
          sx={{
            color: '#fa709a',
            background: 'linear-gradient(135deg, rgba(250, 112, 154, 0.1) 0%, rgba(254, 225, 64, 0.1) 100%)',
            border: '1px solid rgba(250, 112, 154, 0.2)',
            '&:hover': {
              background: 'linear-gradient(135deg, rgba(250, 112, 154, 0.2) 0%, rgba(254, 225, 64, 0.2) 100%)',
              transform: 'scale(1.08)',
              boxShadow: '0 4px 12px rgba(250, 112, 154, 0.25)',
            },
            transition: 'all 0.25s ease',
          }}
        >
          <DownloadIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>
  );
};

export default PatientActionButtons;

