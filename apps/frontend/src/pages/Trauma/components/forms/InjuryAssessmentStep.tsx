/**
 * Injury Assessment Step Component
 * Fourth step of the trauma case creation form
 */

import React from 'react';
import {
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
} from '@mui/material';
import { 
  HEAD_NECK_INJURY_OPTIONS,
  FACE_INJURY_OPTIONS,
  CHEST_INJURY_OPTIONS,
  ABDOMEN_INJURY_OPTIONS,
  EXTREMITIES_INJURY_OPTIONS,
  EXTERNAL_INJURY_OPTIONS
} from '../../constants/traumaConstants';
import { InjuryAssessmentFormData } from '../../types/traumaTypes';
import { getInjurySeverityColor } from '../../helpers/traumaHelpers';

interface InjuryAssessmentStepProps {
  data: InjuryAssessmentFormData;
  onChange: (data: Partial<InjuryAssessmentFormData>) => void;
  errors: Record<string, string>;
  validationErrors?: Record<string, string>;
}

const InjuryAssessmentStep: React.FC<InjuryAssessmentStepProps> = ({
  data,
  onChange,
  errors,
  validationErrors = {},
}) => {
  const handleChange = (field: keyof InjuryAssessmentFormData) => (
    event: any
  ) => {
    onChange({ [field]: event.target.value });
  };

  const bodyRegions = [
    { key: 'headAndNeckInjury', label: 'Head & Neck', options: HEAD_NECK_INJURY_OPTIONS },
    { key: 'faceInjury', label: 'Face', options: FACE_INJURY_OPTIONS },
    { key: 'chestInjury', label: 'Chest', options: CHEST_INJURY_OPTIONS },
    { key: 'abdomenInjury', label: 'Abdomen', options: ABDOMEN_INJURY_OPTIONS },
    { key: 'extremitiesInjury', label: 'Extremities', options: EXTREMITIES_INJURY_OPTIONS },
    { key: 'externalInjury', label: 'External', options: EXTERNAL_INJURY_OPTIONS },
  ] as const;

  const getSeverityCount = () => {
    const severities = Object.values(data);
    const counts = {
      critical: 0,
      severe: 0,
      serious: 0,
      moderate: 0,
      minor: 0,
      none: 0,
    };
    
    severities.forEach(severity => {
      switch (severity) {
        case 'CRITICAL': counts.critical++; break;
        case 'SEVERE': counts.severe++; break;
        case 'SERIOUS': counts.serious++; break;
        case 'MODERATE': counts.moderate++; break;
        case 'MINOR': counts.minor++; break;
        case 'NO_INJURY': counts.none++; break;
      }
    });
    
    return counts;
  };

  const severityCounts = getSeverityCount();

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <h3>Injury Assessment by Body Region</h3>
        <p>Assess and document injuries for each body region using the injury severity scale.</p>
      </Grid>
      
      {bodyRegions.map(({ key, label, options }) => (
        <Grid item xs={12} sm={6} key={key}>
          <FormControl fullWidth>
            <InputLabel>{label} Injury</InputLabel>
            <Select
              value={data[key]}
              onChange={handleChange(key)}
              error={!!errors[key] || !!validationErrors[`injuryAssessment.${key}`]}
              label={`${label} Injury`}
            >
              {options.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        bgcolor: getInjurySeverityColor(option.value as any),
                      }}
                    />
                    {option.label}
                  </Box>
                </MenuItem>
              ))}
            </Select>
            {(errors[key] || validationErrors[`injuryAssessment.${key}`]) && (
              <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                {errors[key] || validationErrors[`injuryAssessment.${key}`]}
              </Typography>
            )}
          </FormControl>
        </Grid>
      ))}
      
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          Injury Summary
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          {severityCounts.critical > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  bgcolor: getInjurySeverityColor('CRITICAL'),
                }}
              />
              <Typography variant="body2">
                Critical: {severityCounts.critical}
              </Typography>
            </Box>
          )}
          {severityCounts.severe > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  bgcolor: getInjurySeverityColor('SEVERE'),
                }}
              />
              <Typography variant="body2">
                Severe: {severityCounts.severe}
              </Typography>
            </Box>
          )}
          {severityCounts.serious > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  bgcolor: getInjurySeverityColor('SERIOUS'),
                }}
              />
              <Typography variant="body2">
                Serious: {severityCounts.serious}
              </Typography>
            </Box>
          )}
          {severityCounts.moderate > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  bgcolor: getInjurySeverityColor('MODERATE'),
                }}
              />
              <Typography variant="body2">
                Moderate: {severityCounts.moderate}
              </Typography>
            </Box>
          )}
          {severityCounts.minor > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  bgcolor: getInjurySeverityColor('MINOR'),
                }}
              />
              <Typography variant="body2">
                Minor: {severityCounts.minor}
              </Typography>
            </Box>
          )}
          {severityCounts.none > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  bgcolor: getInjurySeverityColor('NO_INJURY'),
                }}
              />
              <Typography variant="body2">
                No Injury: {severityCounts.none}
              </Typography>
            </Box>
          )}
        </Box>
      </Grid>
      
      <Grid item xs={12}>
        <Box sx={{ p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
          <Typography variant="body2">
            <strong>Injury Severity Scale:</strong>
            <br />
            • <strong>Critical:</strong> Life-threatening injuries requiring immediate intervention
            <br />
            • <strong>Severe:</strong> Serious injuries requiring urgent care
            <br />
            • <strong>Serious:</strong> Significant injuries requiring prompt attention
            <br />
            • <strong>Moderate:</strong> Moderate injuries requiring medical attention
            <br />
            • <strong>Minor:</strong> Minor injuries requiring basic care
            <br />
            • <strong>No Injury:</strong> No apparent injury to this body region
          </Typography>
        </Box>
      </Grid>
    </Grid>
  );
};

export default InjuryAssessmentStep;
