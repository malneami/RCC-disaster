import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
} from '@mui/material';

import { StrokeCase } from '../../../../services/strokeService';

interface ClinicalAssessmentsCardProps {
  strokeCase: StrokeCase;
}

const ClinicalAssessmentsCard: React.FC<ClinicalAssessmentsCardProps> = ({
  strokeCase,
}) => {
  const assessmentItems = [
    { label: 'NIHSS Baseline', value: strokeCase.nihssBaseline },
    { label: 'NIHSS Discharge', value: strokeCase.nihssDischarge },
    { label: 'mRS Baseline', value: strokeCase.mrsBaseline },
    { label: 'mRS 90-day', value: strokeCase.mrs90day },
    { label: 'Barthel Baseline', value: strokeCase.barthelBaseline },
    { label: 'Barthel Discharge', value: strokeCase.barthelDischarge },
    { label: 'ASPECTS Score', value: strokeCase.aspectsScore },
    { label: 'GCS Baseline', value: strokeCase.gcsBaseline },
  ];

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Clinical Assessments
        </Typography>
        <Grid container spacing={2}>
          {assessmentItems.map((item, index) => (
            <Grid item xs={6} sm={3} key={index}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary">
                  {item.value || 'N/A'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {item.label}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
};

export default ClinicalAssessmentsCard;
