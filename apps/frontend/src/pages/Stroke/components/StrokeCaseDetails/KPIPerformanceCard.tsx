import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  Chip,
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faTimes } from '@fortawesome/free-solid-svg-icons';

import { StrokeCase } from '../../../../services/strokeService';

interface KPIPerformanceCardProps {
  strokeCase: StrokeCase;
}

const KPIPerformanceCard: React.FC<KPIPerformanceCardProps> = ({
  strokeCase,
}) => {
  const kpiItems = [
    { label: 'Door to CT Scan ≤25min', met: strokeCase.metKpi1, key: 'metKpi1' },
    { label: 'Door to Needle ≤60min', met: strokeCase.metKpi4, key: 'metKpi4' },
    { label: 'Door to Mechanical Thrombectomy ≤90min', met: strokeCase.metKpi3, key: 'metKpi3' },
    { label: 'Dysphagia Screening', met: strokeCase.metKpi4, key: 'metKpi4' },
    { label: 'Early Mobilization', met: strokeCase.metKpi5, key: 'metKpi5' },
    { label: 'Secondary Prevention', met: strokeCase.metKpi6, key: 'metKpi6' },
    { label: 'Discharge Planning', met: strokeCase.metKpi7, key: 'metKpi7' },
    { label: 'Follow-up Arranged', met: strokeCase.metKpi8, key: 'metKpi8' },
  ];

  const metCount = kpiItems.filter(item => item.met).length;
  const totalCount = kpiItems.length;
  const percentage = Math.round((metCount / totalCount) * 100);

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          KPI Performance
        </Typography>
        <Box sx={{ mb: 3, textAlign: 'center' }}>
          <Typography variant="h3" color="primary" gutterBottom>
            {percentage}%
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {metCount} of {totalCount} KPIs met
          </Typography>
        </Box>
        <Grid container spacing={1}>
          {kpiItems.map((item, index) => (
            <Grid item xs={12} sm={6} key={index}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FontAwesomeIcon
                  icon={item.met ? faCheck : faTimes}
                  style={{
                    color: item.met ? '#4caf50' : '#f44336',
                    fontSize: '16px'
                  }}
                />
                <Typography
                  variant="body2"
                  sx={{
                    color: item.met ? 'success.main' : 'error.main',
                    flex: 1
                  }}
                >
                  {item.label}
                </Typography>
                <Chip
                  label={item.met ? 'Met' : 'Not Met'}
                  color={item.met ? 'success' : 'error'}
                  size="small"
                />
              </Box>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
};

export default KPIPerformanceCard;
