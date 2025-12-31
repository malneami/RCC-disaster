import React from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Fade,
} from '@mui/material';
import { Patient } from '../../../services/patientService';
import ModernPatientListItem from './ModernPatientListItem';

interface ModernPatientListProps {
  patients: Patient[];
  loading?: boolean;
  emptyMessage?: string;
  onViewPatient: (patient: Patient) => void;
  onEditPatient: (patient: Patient) => void;
  onExportPatient: (patient: Patient) => void;
}

const ModernPatientList: React.FC<ModernPatientListProps> = ({
  patients,
  loading = false,
  emptyMessage = 'No patients found',
  onViewPatient,
  onEditPatient,
  onExportPatient,
}) => {
  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '400px',
          padding: 4,
          background: 'linear-gradient(135deg, #f8f9ff 0%, #e8f4ff 100%)',
          borderRadius: '14px',
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress
            size={52}
            thickness={4}
            sx={{
              color: '#4facfe',
              mb: 2.5,
            }}
          />
          <Typography
            variant="body1"
            sx={{
              color: '#4facfe',
              fontSize: '0.9375rem',
              fontWeight: 500,
            }}
          >
            Loading patients...
          </Typography>
        </Box>
      </Box>
    );
  }

  if (patients.length === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '400px',
          padding: 4,
          textAlign: 'center',
          background: 'linear-gradient(135deg, #f8f9ff 0%, #e8f4ff 100%)',
          borderRadius: '14px',
          border: '2px dashed rgba(79, 172, 254, 0.3)',
        }}
      >
        <Box
          sx={{
            width: 90,
            height: 90,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 3,
            boxShadow: '0 6px 20px rgba(79, 172, 254, 0.25)',
          }}
        >
          <Typography
            variant="h3"
            sx={{
              color: '#ffffff',
              fontWeight: 300,
              fontSize: '2.5rem',
            }}
          >
            👤
          </Typography>
        </Box>
        <Typography
          variant="h5"
          sx={{
            color: '#1a237e',
            fontWeight: 600,
            mb: 1.5,
          }}
        >
          {emptyMessage}
        </Typography>
        <Typography
          variant="body1"
          sx={{
            color: '#4facfe',
            fontSize: '0.9375rem',
            maxWidth: '400px',
            fontWeight: 500,
          }}
        >
          Try adjusting your search or filters to find patients.
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        width: '100%',
        padding: { xs: 1, sm: 2 },
      }}
    >
      <Fade in={true} timeout={400}>
        <Box>
          {patients.map((patient, index) => (
            <Box
              key={patient.id}
              sx={{
                animation: `fadeInUp 0.4s ease-out ${index * 0.05}s both`,
                '@keyframes fadeInUp': {
                  from: {
                    opacity: 0,
                    transform: 'translateY(15px)',
                  },
                  to: {
                    opacity: 1,
                    transform: 'translateY(0)',
                  },
                },
              }}
            >
              <ModernPatientListItem
                patient={patient}
                index={index}
                onViewPatient={onViewPatient}
                onEditPatient={onEditPatient}
                onExportPatient={onExportPatient}
              />
            </Box>
          ))}
        </Box>
      </Fade>
    </Box>
  );
};

export default ModernPatientList;

