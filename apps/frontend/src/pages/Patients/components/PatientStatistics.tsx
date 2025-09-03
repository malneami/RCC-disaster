import React from 'react';
import { Box, Typography } from '@mui/material';

const PatientStatistics: React.FC = () => {
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Patient Statistics
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Statistics dashboard coming soon...
      </Typography>
    </Box>
  );
};

export default PatientStatistics;
