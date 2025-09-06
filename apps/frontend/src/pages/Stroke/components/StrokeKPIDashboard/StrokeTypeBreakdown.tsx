import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Box,
} from '@mui/material';

import { StrokeKPISummary } from '../../../../services/strokeService';

interface StrokeTypeBreakdownProps {
  kpiSummary: StrokeKPISummary;
}

const StrokeTypeBreakdown: React.FC<StrokeTypeBreakdownProps> = ({ kpiSummary }) => {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Stroke Type Breakdown
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary">
                {kpiSummary.strokeTypeBreakdown.ischemic}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Ischemic
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="error">
                {kpiSummary.strokeTypeBreakdown.hemorrhagic}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Hemorrhagic
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="warning.main">
                {kpiSummary.strokeTypeBreakdown.tia}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                TIA
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="text.secondary">
                0
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Unknown
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default StrokeTypeBreakdown;
