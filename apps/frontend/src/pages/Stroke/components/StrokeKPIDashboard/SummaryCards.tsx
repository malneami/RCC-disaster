import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock, faChartLine, faCheckCircle, faTimesCircle } from '@fortawesome/free-solid-svg-icons';

import { StrokeKPISummary } from '../../../../services/strokeService';

interface SummaryCardsProps {
  kpiSummary: StrokeKPISummary;
}

const SummaryCards: React.FC<SummaryCardsProps> = ({ kpiSummary }) => {
  return (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      {/* Total Cases */}
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ 
              bgcolor: 'primary.main', 
              borderRadius: '50%', 
              p: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <FontAwesomeIcon 
                icon={faChartLine} 
                style={{ color: 'white', fontSize: '24px' }}
              />
            </Box>
            <Box>
              <Typography variant="h6">
                {kpiSummary.totalCases}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Cases
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Average Door to Imaging */}
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ 
              bgcolor: 'info.main', 
              borderRadius: '50%', 
              p: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <FontAwesomeIcon 
                icon={faClock} 
                style={{ color: 'white', fontSize: '24px' }}
              />
            </Box>
            <Box>
              <Typography variant="h6">
                {Math.round(kpiSummary.averageTimings.doorToImaging)} min
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Avg Door-to-Imaging
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Success Rate */}
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ 
              bgcolor: 'success.main', 
              borderRadius: '50%', 
              p: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <FontAwesomeIcon 
                icon={faCheckCircle} 
                style={{ color: 'white', fontSize: '24px' }}
              />
            </Box>
            <Box>
              <Typography variant="h6">
                {Math.round(kpiSummary.outcomes.successRate)}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Success Rate
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Mortality Rate */}
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ 
              bgcolor: 'error.main', 
              borderRadius: '50%', 
              p: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <FontAwesomeIcon 
                icon={faTimesCircle} 
                style={{ color: 'white', fontSize: '24px' }}
              />
            </Box>
            <Box>
              <Typography variant="h6">
                {Math.round(kpiSummary.outcomes.mortalityRate)}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Mortality Rate
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default SummaryCards;
