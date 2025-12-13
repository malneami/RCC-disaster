import {
  Box,
  Typography,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Edit as EditIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { Patient } from '../../../../services/patientService';
import { TableColumn } from '../../../../components/Common/DataTable';
import { formatAgeForDisplay } from '../../../../utils/ageCalculator';

interface PatientTableColumnsProps {
  onViewPatient: (patient: Patient) => void;
  onEditPatient: (patient: Patient) => void;
  onExportPatient: (patient: Patient) => void;
}

export const usePatientTableColumns = ({
  onViewPatient,
  onEditPatient,
  onExportPatient,
}: PatientTableColumnsProps): TableColumn<Patient>[] => {

  // Get privacy level color helper
  const getPrivacyLevelColor = (privacyLevel: string) => {
    switch (privacyLevel) {
      case 'CONFIDENTIAL': return 'error';
      case 'RESTRICTED': return 'warning';
      case 'PRIVATE': return 'info';
      case 'INTERNAL': return 'success';
      case 'PUBLIC': return 'default';
      default: return 'default';
    }
  };

  return [
    {
      key: 'patient',
      label: 'Patient',
      render: (patient: Patient) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box>
            <Typography variant="body2" fontWeight="medium">
              {patient.firstName} {patient.lastName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {patient.middleName && `${patient.middleName} `}
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      key: 'nationalId',
      label: 'National ID',
      render: (patient: Patient) => (
        patient.nationalId ? (
          <Typography variant="body2" fontFamily="monospace">
            {patient.nationalId}
          </Typography>
        ) : (
          <Typography variant="body2" color="text.secondary">
            Not provided
          </Typography>
        )
      ),
    },
    {
      key: 'mrn',
      label: 'MRN',
      render: (patient: Patient) => (
        patient.mrn ? (
          <Typography variant="body2" fontFamily="monospace">
            {patient.mrn}
          </Typography>
        ) : (
          <Typography variant="body2" color="text.secondary">
            Not assigned
          </Typography>
        )
      ),
    },
    {
      key: 'ageGender',
      label: 'Age/Gender',
      render: (patient: Patient) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2">
            {formatAgeForDisplay(patient.age, patient.dateOfBirth, patient.ageMonths, patient.ageDays)}
          </Typography>
        </Box>
      ),
    },
    {
      key: 'contact',
      label: 'Contact',
      render: (patient: Patient) => (
        <Box>
          {patient.phoneNumber && (
            <Typography variant="body2">
              {patient.phoneNumber}
            </Typography>
          )}
          {patient.email && (
            <Typography variant="caption" color="text.secondary">
              {patient.email}
            </Typography>
          )}
        </Box>
      ),
    },
    {
      key: 'privacyLevel',
      label: 'Privacy Level',
      render: (patient: Patient) => (
        <Typography variant="body2" color={`${getPrivacyLevelColor(patient.privacyLevel)}.main`}>
          {patient.privacyLevel}
        </Typography>
      ),
    },
    {
      key: 'lastAccessed',
      label: 'Last Accessed',
      render: (patient: Patient) => (
        patient.lastAccessedAt ? (
          <Typography variant="body2">
            {format(new Date(patient.lastAccessedAt), 'MMM dd, HH:mm')}
          </Typography>
        ) : (
          <Typography variant="body2" color="text.secondary">
            Never
          </Typography>
        )
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (patient: Patient) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="View Details">
            <IconButton size="small" onClick={() => onViewPatient(patient)}>
              <ViewIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit Patient">
            <IconButton size="small" onClick={() => onEditPatient(patient)}>
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Export Patient Data">
            <IconButton size="small" onClick={() => onExportPatient(patient)}>
              <DownloadIcon />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];
};
