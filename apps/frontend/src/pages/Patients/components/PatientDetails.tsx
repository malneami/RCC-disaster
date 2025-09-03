import React from 'react';
import { Box, Typography } from '@mui/material';

const PatientDetails: React.FC<{
  patient: any;
  onPatientUpdated: (patient: any) => void;
  onPatientDeleted: (patientId: string) => void;
}> = () => {
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Patient Details
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Patient details view coming soon...
      </Typography>
    </Box>
  );
};

export default PatientDetails;
