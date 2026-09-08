import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHospital } from '@fortawesome/free-solid-svg-icons';

const LoadingSpinner: React.FC = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        bgcolor: 'background.default',
      }}
    >
      <FontAwesomeIcon 
        icon={faHospital}
        style={{
          fontSize: '48px',
          color: '#1976d2',
          marginBottom: '16px',
        }}
      />
      <CircularProgress size={40} sx={{ mb: 2 }} />
      <Typography variant="body2" color="text.secondary">
        Loading MASAR...
      </Typography>
    </Box>
  );
};

export default LoadingSpinner;