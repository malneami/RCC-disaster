import React from 'react';
import { Chip, Tooltip, Box } from '@mui/material';
import { stemiOutcomeFormService } from '../services/stemiOutcomeFormService';

interface StemiOutcomeFormCompletenessProps {
  stemiCase: {
    outcomeFormCompleted?: boolean;
    outcomeFormCompleteness?: number;
    outcomePercentageCompleteness?: number;
    cathLabActivationTime?: string;
    cathLabArrivalTime?: string;
    pciProcedureStartTime?: string;
    pciProcedureCompleteTime?: string;
    postPciComplications?: string;
    dischargeStatus?: string;
    dischargeMedications?: string;
    followUpAppointmentDate?: string;
    followUpAppointmentProvider?: string;
  };
  showDetails?: boolean;
}

const StemiOutcomeFormCompleteness: React.FC<StemiOutcomeFormCompletenessProps> = ({
  stemiCase,
  showDetails = false,
}) => {
  const completeness = stemiCase.outcomePercentageCompleteness || 0;
  
  const color = stemiOutcomeFormService.getCompletenessColor(completeness);
  const status = stemiOutcomeFormService.getCompletenessStatus(completeness);

  const getTooltipText = () => {
    if (stemiCase.outcomeFormCompleted) {
      return `Outcome form completed (${completeness}% complete)`;
    }
    
    const completedFields = [];
    const totalFields = [
      'cathLabActivationTime',
      'cathLabArrivalTime',
      'pciProcedureStartTime',
      'pciProcedureCompleteTime',
      'postPciComplications',
      'dischargeStatus',
      'dischargeMedications',
      'followUpAppointmentDate',
      'followUpAppointmentProvider',
    ];

    totalFields.forEach(field => {
      const value = stemiCase[field as keyof typeof stemiCase];
      if (value !== null && value !== undefined && value !== '') {
        completedFields.push(field);
      }
    });

    return `Outcome form ${completeness}% complete (${completedFields.length}/${totalFields.length} fields)`;
  };

  const chipLabel = showDetails 
    ? `${status} (${completeness}%)`
    : `${completeness}%`;

  return (
    <Tooltip title={getTooltipText()} arrow>
      <Box display="flex" alignItems="center" gap={1}>
        <Chip
          label={chipLabel}
          color={color}
          size="small"
          variant={stemiCase.outcomeFormCompleted ? "filled" : "outlined"}
        />
      </Box>
    </Tooltip>
  );
};

export default StemiOutcomeFormCompleteness;
