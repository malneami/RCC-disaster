import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Avatar,
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser } from '@fortawesome/free-solid-svg-icons';

import { StrokeCase } from '../../../../services/strokeService';

interface PatientInformationCardProps {
  strokeCase: StrokeCase;
}

const PatientInformationCard: React.FC<PatientInformationCardProps> = ({
  strokeCase,
}) => {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Patient Information
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: 'primary.main' }}>
            <FontAwesomeIcon icon={faUser} />
          </Avatar>
          <Box>
            <Typography variant="subtitle1" fontWeight="medium">
              {strokeCase.patient?.firstName} {strokeCase.patient?.lastName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              DOB: {strokeCase.patient?.dateOfBirth ? 
                new Date(strokeCase.patient.dateOfBirth).toLocaleDateString() : 'N/A'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Gender: {strokeCase.patient?.gender || 'N/A'}
            </Typography>
          </Box>
        </Box>
        <Typography variant="body2" color="text.secondary">
          Patient ID: {strokeCase.patientId}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default PatientInformationCard;
