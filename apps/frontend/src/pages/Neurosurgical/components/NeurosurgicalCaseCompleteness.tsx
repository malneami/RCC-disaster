import React from 'react';
import { Box, Chip, CircularProgress, Tooltip, Typography } from '@mui/material';
import { NeurosurgicalCase } from '../../../services/neurosurgicalService';

interface NeurosurgicalCaseCompletenessProps {
  neuroCase: NeurosurgicalCase;
  showDetails?: boolean;
}

/** Case data (pre-outcome) fields — 50% of combined score */
const CASE_DATA_FIELDS: Array<keyof NeurosurgicalCase> = [
  'triggerReason',
  'severity',
  'ctLocation',
  'doorTime',
  'doorOutTime',
  'rccActivationTime',
  'ctScanStartTime',
  'ctReportFinalTime',
  'neurosurgeonConnectedAt',
  'gcs',
  'pupils',
];

/** Outcome / disposition fields — 50% of combined score */
const OUTCOME_FIELDS: Array<keyof NeurosurgicalCase> = [
  'definitiveDisposition',
  'definitiveTreatment',
  'neurologicalOutcome',
];

function isFilled(value: unknown): boolean {
  if (value === null || value === undefined || value === '') return false;
  return true;
}

export function calculateNeuroCaseDataCompleteness(neuroCase: NeurosurgicalCase): number {
  const filled = CASE_DATA_FIELDS.filter((f) => isFilled(neuroCase[f])).length;
  return Math.round((filled / CASE_DATA_FIELDS.length) * 100);
}

export function calculateNeuroOutcomeCompleteness(neuroCase: NeurosurgicalCase): number {
  const filled = OUTCOME_FIELDS.filter((f) => isFilled(neuroCase[f])).length;
  return Math.round((filled / OUTCOME_FIELDS.length) * 100);
}

export function calculateNeuroCombinedCompleteness(neuroCase: NeurosurgicalCase): number {
  const caseData = calculateNeuroCaseDataCompleteness(neuroCase);
  const outcome = calculateNeuroOutcomeCompleteness(neuroCase);
  return Math.round(caseData * 0.5 + outcome * 0.5);
}

function getCompletenessColor(
  completeness: number,
): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' {
  if (completeness >= 90) return 'success';
  if (completeness >= 75) return 'primary';
  if (completeness >= 50) return 'warning';
  return 'error';
}

function getProgressColor(completeness: number): string {
  if (completeness >= 90) return '#2e7d32';
  if (completeness >= 75) return '#1976d2';
  if (completeness >= 50) return '#ed6c02';
  return '#d32f2f';
}

const NeurosurgicalCaseCompleteness: React.FC<NeurosurgicalCaseCompletenessProps> = ({
  neuroCase,
  showDetails = false,
}) => {
  const caseDataCompleteness = calculateNeuroCaseDataCompleteness(neuroCase);
  const outcomeCompleteness = calculateNeuroOutcomeCompleteness(neuroCase);
  const combined = calculateNeuroCombinedCompleteness(neuroCase);
  const color = getCompletenessColor(combined);
  const progressColor = getProgressColor(combined);

  const tooltip = [
    `Case data (50%): ${caseDataCompleteness}%`,
    `Outcome / disposition (50%): ${outcomeCompleteness}%`,
    `Combined: ${combined}%`,
  ].join('\n');

  return (
    <Tooltip title={<Box whiteSpace="pre-line">{tooltip}</Box>} arrow>
      <Box display="flex" alignItems="center" gap={1}>
        <Box position="relative" display="inline-flex">
          <CircularProgress
            variant="determinate"
            value={100}
            size={40}
            thickness={3}
            sx={{ color: 'action.hover', position: 'absolute' }}
          />
          <CircularProgress
            variant="determinate"
            value={combined}
            size={40}
            thickness={3}
            sx={{ color: progressColor }}
          />
          <Box
            sx={{
              top: 0,
              left: 0,
              bottom: 0,
              right: 0,
              position: 'absolute',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography variant="caption" component="div" fontWeight={600} fontSize={10}>
              {combined}%
            </Typography>
          </Box>
        </Box>
        {showDetails && (
          <Chip label={`${combined}%`} color={color} size="small" variant="outlined" />
        )}
      </Box>
    </Tooltip>
  );
};

export default NeurosurgicalCaseCompleteness;
