import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
} from '@mui/material';

import { StrokeCase, StrokeService } from '../../../../services/strokeService';

interface TreatmentInformationCardProps {
  strokeCase: StrokeCase;
}

const TreatmentInformationCard: React.FC<TreatmentInformationCardProps> = ({
  strokeCase,
}) => {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Treatment Information
        </Typography>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">Selected Treatment:</Typography>
          <Typography variant="body1">
            {strokeCase.selectedTreatment ? 
              StrokeService.getStrokeTreatmentLabel(strokeCase.selectedTreatment) : 'Not specified'}
          </Typography>
        </Box>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">Eligible for Thrombolysis:</Typography>
          <Typography variant="body1">
            {strokeCase.eligibleForThrombolysis ? 'Yes' : 'No'}
          </Typography>
        </Box>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">Eligible for Thrombectomy:</Typography>
          <Typography variant="body1">
            {strokeCase.eligibleForThrombectomy ? 'Yes' : 'No'}
          </Typography>
        </Box>
        {strokeCase.thrombolysisContraindications && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">Thrombolysis Contraindications:</Typography>
            <Typography variant="body2">{strokeCase.thrombolysisContraindications}</Typography>
          </Box>
        )}
        {strokeCase.thrombectomyContraindications && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">Thrombectomy Contraindications:</Typography>
            <Typography variant="body2">{strokeCase.thrombectomyContraindications}</Typography>
          </Box>
        )}
        {strokeCase.complications && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">Complications:</Typography>
            <Typography variant="body2">{strokeCase.complications}</Typography>
          </Box>
        )}
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">Treatment Successful:</Typography>
          <Typography variant="body1">
            {strokeCase.successful ? 'Yes' : 'No'}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default TreatmentInformationCard;
