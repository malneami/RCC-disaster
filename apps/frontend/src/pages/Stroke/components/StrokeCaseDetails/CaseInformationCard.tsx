import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
} from '@mui/material';

import { StrokeCase, StrokeService } from '../../../../services/strokeService';
import { getCaseTypeLabel } from '../../../../helpers/formatUtils';

interface CaseInformationCardProps {
  strokeCase: StrokeCase;
}

const CaseInformationCard: React.FC<CaseInformationCardProps> = ({
  strokeCase,
}) => {
  const caseTypeLabel = getCaseTypeLabel(undefined, undefined, strokeCase.destinationHospitalId, strokeCase.originHospitalId);
  
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Case Information
        </Typography>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">Ticket Number:</Typography>
          <Typography variant="body1">{strokeCase.ticket?.ticketNumber || 'N/A'}</Typography>
        </Box>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">Case Type:</Typography>
          <Chip
            label={caseTypeLabel}
            color={caseTypeLabel === 'Transferred' ? 'info' : 'primary'}
            size="small"
          />
        </Box>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">Stroke Type:</Typography>
          <Chip
            label={StrokeService.getStrokeTypeLabel(strokeCase.strokeType)}
            color="primary"
            size="small"
          />
        </Box>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">Severity:</Typography>
          {strokeCase.strokeSeverity ? (
            <Chip
              label={StrokeService.getStrokeSeverityLabel(strokeCase.strokeSeverity)}
              color="warning"
              size="small"
            />
          ) : (
            <Typography variant="body2">Not specified</Typography>
          )}
        </Box>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">Current Status:</Typography>
          <Chip
            label={StrokeService.getStrokeStatusLabel(strokeCase.currentStatus)}
            color="info"
            size="small"
          />
        </Box>
        {strokeCase.chiefComplaint && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">Chief Complaint:</Typography>
            <Typography variant="body2">{strokeCase.chiefComplaint}</Typography>
          </Box>
        )}
        {strokeCase.transferRequestDateTime && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">Transfer Request Date & Time:</Typography>
            <Typography variant="body2">{new Date(strokeCase.transferRequestDateTime).toLocaleString()}</Typography>
          </Box>
        )}
        {strokeCase.transferArrivalDateTime && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">Transfer Arrival Date & Time:</Typography>
            <Typography variant="body2">{new Date(strokeCase.transferArrivalDateTime).toLocaleString()}</Typography>
          </Box>
        )}
        {strokeCase.presentingSymptoms && (
          <Box>
            <Typography variant="body2" color="text.secondary">Presenting Symptoms:</Typography>
            <Typography variant="body2">{strokeCase.presentingSymptoms}</Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default CaseInformationCard;
