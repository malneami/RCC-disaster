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
              Age: {strokeCase.patient?.age ? `${strokeCase.patient.age} years` : 'N/A'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Gender: {strokeCase.patient?.gender || 'N/A'}
            </Typography>
          </Box>
        </Box>
        <Typography variant="body2" color="text.secondary">
          National ID: {strokeCase.patient?.nationalId || 'Not set'}
        </Typography>
        {strokeCase.patient?.mrn && (
          <Typography variant="body2" color="text.secondary">
            MRN: {strokeCase.patient.mrn}
          </Typography>
        )}
        {strokeCase.patient?.phoneNumber && (
          <Typography variant="body2" color="text.secondary">
            Phone: {strokeCase.patient.phoneNumber}
          </Typography>
        )}
        {strokeCase.patient?.email && (
          <Typography variant="body2" color="text.secondary">
            Email: {strokeCase.patient.email}
          </Typography>
        )}
        <Typography variant="body2" color="text.secondary">
          Patient ID: {strokeCase.patientId}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default PatientInformationCard;
