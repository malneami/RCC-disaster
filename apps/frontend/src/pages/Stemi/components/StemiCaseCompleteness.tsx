import React from 'react';
import { Chip, Tooltip, Box } from '@mui/material';

interface StemiCaseCompletenessProps {
  stemiCase: {
    // Outcome form fields
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
    
    // Case data fields
    triageTime?: string;
    firstEcgTime?: string;
    eligibleForPrimaryPci?: boolean;
    thrombolyticGiven?: boolean;
    
    // Dependent fields for eligibleForPrimaryPci = true
    pciLocation?: string;
    doorOutTime?: string;
    balloonInflationTime?: string;
  };
  showDetails?: boolean;
}

const StemiCaseCompleteness: React.FC<StemiCaseCompletenessProps> = ({
  stemiCase,
  showDetails = false,
}) => {
  // Calculate outcome form completeness (50% weight)
  const outcomeCompleteness = stemiCase.outcomePercentageCompleteness || 0;
  const outcomeWeight = 0.5;
  
  // Calculate case data completeness (50% weight)
  const caseDataCompleteness = calculateCaseDataCompleteness(stemiCase);
  const caseDataWeight = 0.5;
  
  // Calculate combined completeness
  const combinedCompleteness = Math.round(
    (outcomeCompleteness * outcomeWeight) + (caseDataCompleteness * caseDataWeight)
  );
  
  const color = getCompletenessColor(combinedCompleteness);
  const status = getCompletenessStatus(combinedCompleteness);

  const getTooltipText = () => {
    const outcomeText = `Outcome Form: ${outcomeCompleteness}%`;
    const caseDataText = `Case Data: ${caseDataCompleteness}%`;
    const combinedText = `Combined: ${combinedCompleteness}%`;
    
    return `${outcomeText}\n${caseDataText}\n${combinedText}`;
  };

  const chipLabel = showDetails 
    ? `${status} (${combinedCompleteness}%)`
    : `${combinedCompleteness}%`;

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

// Calculate case data completeness based on required fields
function calculateCaseDataCompleteness(stemiCase: StemiCaseCompletenessProps['stemiCase']): number {
  const requiredFields = [
    'triageTime',
    'firstEcgTime',
    'eligibleForPrimaryPci',
    'thrombolyticGiven',
  ];
  
  let completedFields = 0;
  let totalFields = requiredFields.length;
  
  // Check basic required fields
  requiredFields.forEach(field => {
    const value = stemiCase[field as keyof typeof stemiCase];
    if (value !== null && value !== undefined && value !== '') {
      completedFields++;
    }
  });
  
  // If eligibleForPrimaryPci is true, check dependent fields
  if (stemiCase.eligibleForPrimaryPci === true) {
    const dependentFields = ['pciLocation', 'doorOutTime', 'balloonInflationTime'];
    let dependentCompleted = 0;
    
    dependentFields.forEach(field => {
      const value = stemiCase[field as keyof typeof stemiCase];
      if (value !== null && value !== undefined && value !== '') {
        dependentCompleted++;
      }
    });
    
    // Add dependent fields to total and completed counts
    totalFields += dependentFields.length;
    completedFields += dependentCompleted;
  }
  
  return totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0;
}

// Helper functions for color and status
function getCompletenessColor(completeness: number): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' {
  if (completeness >= 90) return 'success';
  if (completeness >= 75) return 'primary';
  if (completeness >= 50) return 'warning';
  return 'error';
}

function getCompletenessStatus(completeness: number): string {
  if (completeness >= 90) return 'Complete';
  if (completeness >= 75) return 'Good';
  if (completeness >= 50) return 'Partial';
  return 'Incomplete';
}

export default StemiCaseCompleteness;
