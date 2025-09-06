import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Box,
} from '@mui/material';

import { StrokeKPISummary } from '../../../../services/strokeService';

interface ClinicalOutcomesProps {
  kpiSummary: StrokeKPISummary;
}

const ClinicalOutcomes: React.FC<ClinicalOutcomesProps> = ({ kpiSummary }) => {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Clinical Outcomes
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h5" color="success.main">
                {Math.round(kpiSummary.outcomes.successRate)}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Treatment Success
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h5" color="error.main">
                {Math.round(kpiSummary.outcomes.readmissionRate)}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                30-day Readmission
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h5" color="info.main">
                {Math.round(kpiSummary.outcomes.averageLengthOfStay)} days
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Avg Length of Stay
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h5" color="primary.main">
                {Math.round(kpiSummary.outcomes.independentDischargeRate)}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Independent Discharge
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default ClinicalOutcomes;
