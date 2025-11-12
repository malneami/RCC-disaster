import React from 'react';
import { Chip, Tooltip, Box } from '@mui/material';
import { strokeOutcomeFormService } from '../services/strokeOutcomeFormService';

interface OutcomeFormCompletenessProps {
  strokeCase: {
    outcomeFormCompleteness?: number;
    outcomePercentageCompleteness?: number;
    dischargeType?: string;
    followUpNotCompletedReason?: string;
    followUpSpecify?: string;
    followUpType?: string;
    dischargeModifiedRankinScale?: number;
    followUpModifiedRankinScale?: number;
    closureReport?: string;
    functionalStatus?: string;
    mortality?: string;
  };
  showDetails?: boolean;
}

const OutcomeFormCompleteness: React.FC<OutcomeFormCompletenessProps> = ({
  strokeCase,
  showDetails = false,
}) => {
  const completeness = strokeCase.outcomePercentageCompleteness || 0;
  
  const color = strokeOutcomeFormService.getCompletenessColor(completeness);
  const status = strokeOutcomeFormService.getCompletenessStatus(completeness);

  const getTooltipText = () => {
    // Check if form is completed based on completion date (if available) or 100% completeness
    const isCompleted = completeness === 100;
    
    if (isCompleted) {
      return `Outcome form completed (${completeness}% complete)`;
    }
    
    const completedFields = [];
    const totalFields = [
      'dischargeType',
      'followUpNotCompletedReason', 
      'followUpSpecify',
      'followUpType',
      'dischargeModifiedRankinScale',
      'followUpModifiedRankinScale',
      'closureReport',
      'functionalStatus',
      'mortality',
    ];

    totalFields.forEach(field => {
      const value = strokeCase[field as keyof typeof strokeCase];
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
          variant={completeness === 100 ? "filled" : "outlined"}
        />
        {completeness === 100 && (
          <Chip
            label="Completed"
            color="success"
            size="small"
            variant="outlined"
          />
        )}
      </Box>
    </Tooltip>
  );
};

export default OutcomeFormCompleteness;
