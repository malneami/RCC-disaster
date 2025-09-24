import React from 'react';
import { Chip, Tooltip, Box } from '@mui/material';
import { StrokeCase } from '../../../services/strokeService';

interface StrokeCaseCompletenessProps {
  strokeCase: StrokeCase;
  showDetails?: boolean;
}

const StrokeCaseCompleteness: React.FC<StrokeCaseCompletenessProps> = ({
  strokeCase,
  showDetails = false,
}) => {
  // Calculate outcome form completeness (50% weight)
  const outcomeCompleteness = strokeCase.outcomePercentageCompleteness || 0;
  const outcomeWeight = 0.5;
  
  // Calculate case data completeness (50% weight)
  const caseDataCompleteness = calculateCaseDataCompleteness(strokeCase);
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
          variant={strokeCase.outcomePercentageCompleteness === 100 ? "filled" : "outlined"}
        />
      </Box>
    </Tooltip>
  );
};

// Calculate case data completeness based on required fields
function calculateCaseDataCompleteness(strokeCase: StrokeCase): number {
  // Core required fields for stroke cases
  const requiredFields = [
    'modeOfArrival',
    'timeOfTriage',
    'timeOfPhysicianAssessment',
    'strokeTypeDetailed',
    'ctScanPerformed',
    'candidateForIVThrombolysis',
    'candidateForMechanicalThrombectomy',
    'disposition',
  ];
  
  let completedFields = 0;
  let totalFields = requiredFields.length;
  
  // Check basic required fields
  requiredFields.forEach(field => {
    const value = strokeCase[field as keyof StrokeCase];
    if (value !== null && value !== undefined && value !== '') {
      completedFields++;
    }
  });
  
  // If CT scan was performed, check CT-related fields
  if (strokeCase.ctScanPerformed === true) {
    const ctFields = ['timeOfCtScanStart', 'timeOfCtReportFinal', 'ctFindings'];
    let ctCompleted = 0;
    
    ctFields.forEach(field => {
      const value = strokeCase[field as keyof StrokeCase];
      if (value !== null && value !== undefined && value !== '') {
        ctCompleted++;
      }
    });
    
    totalFields += ctFields.length;
    completedFields += ctCompleted;
  }
  
  // If candidate for IV thrombolysis, check thrombolysis fields
  if (strokeCase.candidateForIVThrombolysis === 'YES') {
    const thrombolysisFields = ['thrombolysisOrderTime', 'ivThrombolysisAdministrationTime', 'ivThrombolysisGiven'];
    let thrombolysisCompleted = 0;
    
    thrombolysisFields.forEach(field => {
      const value = strokeCase[field as keyof StrokeCase];
      if (value !== null && value !== undefined && value !== '') {
        thrombolysisCompleted++;
      }
    });
    
    totalFields += thrombolysisFields.length;
    completedFields += thrombolysisCompleted;
  }
  
  // If candidate for mechanical thrombectomy, check thrombectomy fields
  if (strokeCase.candidateForMechanicalThrombectomy === 'YES') {
    const thrombectomyFields = ['timeOfMechanicalThrombectomyPuncture', 'mechanicalThrombectomyPerformed', 'timeOfThrombectomyComplete'];
    let thrombectomyCompleted = 0;
    
    thrombectomyFields.forEach(field => {
      const value = strokeCase[field as keyof StrokeCase];
      if (value !== null && value !== undefined && value !== '') {
        thrombectomyCompleted++;
      }
    });
    
    totalFields += thrombectomyFields.length;
    completedFields += thrombectomyCompleted;
  }
  
  // If transfer to another hospital, check transfer fields
  if (strokeCase.transferToAnotherHospital === true) {
    const transferFields = ['timeOfTransferActivation', 'timeOfTransferDeparture', 'prehospitalNotificationBySrca'];
    let transferCompleted = 0;
    
    transferFields.forEach(field => {
      const value = strokeCase[field as keyof StrokeCase];
      if (value !== null && value !== undefined && value !== '') {
        transferCompleted++;
      }
    });
    
    totalFields += transferFields.length;
    completedFields += transferCompleted;
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

export default StrokeCaseCompleteness;
