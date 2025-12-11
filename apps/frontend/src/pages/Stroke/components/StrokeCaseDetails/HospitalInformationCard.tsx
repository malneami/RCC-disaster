import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHospital } from '@fortawesome/free-solid-svg-icons';

import { StrokeCase, StrokeService } from '../../../../services/strokeService';

interface HospitalInformationCardProps {
  strokeCase: StrokeCase;
}

const HospitalInformationCard: React.FC<HospitalInformationCardProps> = ({
  strokeCase,
}) => {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Hospital Information
        </Typography>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">Origin Hospital:</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <FontAwesomeIcon 
              icon={faHospital} 
              style={{ marginRight: '8px', color: '#1976d2' }}
            />
            <Typography variant="body1">{strokeCase.originHospital?.name || 'N/A'}</Typography>
          </Box>
        </Box>
        {strokeCase.destinationHospital && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">Destination Hospital:</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <FontAwesomeIcon 
                icon={faHospital} 
                style={{ marginRight: '8px', color: '#1976d2' }}
              />
              <Typography variant="body1">{strokeCase.destinationHospital.name}</Typography>
            </Box>
          </Box>
        )}
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">Stroke Unit Available:</Typography>
          <Typography variant="body1">
            {strokeCase.originHospital?.hasStrokeUnit ? 'Yes' : 'No'}
          </Typography>
        </Box>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">Thrombolysis Available:</Typography>
          <Typography variant="body1">
            {strokeCase.originHospital?.hasThrombolysis ? 'Yes' : 'No'}
          </Typography>
        </Box>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">Thrombectomy Available:</Typography>
          <Typography variant="body1">
            {strokeCase.originHospital?.hasThrombectomy ? 'Yes' : 'No'}
          </Typography>
        </Box>
        {strokeCase.modeOfArrival && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">Mode of Arrival:</Typography>
            <Typography variant="body1">
              {StrokeService.getModeOfArrivalLabel(strokeCase.modeOfArrival)}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default HospitalInformationCard;
