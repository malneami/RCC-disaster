import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  Box,
  Chip,
} from '@mui/material';

import { StrokeKPISummary } from '../../../../services/strokeService';

interface KPIPerformanceTableProps {
  kpiSummary: StrokeKPISummary;
}

const KPIPerformanceTable: React.FC<KPIPerformanceTableProps> = ({ kpiSummary }) => {
  const kpiData = [
    {
      number: 1,
      label: 'Door to Imaging ≤25min',
      met: kpiSummary.kpiPerformance.kpi1.met,
      total: kpiSummary.kpiPerformance.kpi1.total,
      percentage: kpiSummary.kpiPerformance.kpi1.percentage,
    },
    {
      number: 2,
      label: 'Door to Needle ≤60min',
      met: kpiSummary.kpiPerformance.kpi2.met,
      total: kpiSummary.kpiPerformance.kpi2.total,
      percentage: kpiSummary.kpiPerformance.kpi2.percentage,
    },
    {
      number: 3,
      label: 'Door to Groin ≤90min',
      met: kpiSummary.kpiPerformance.kpi3.met,
      total: kpiSummary.kpiPerformance.kpi3.total,
      percentage: kpiSummary.kpiPerformance.kpi3.percentage,
    },
    {
      number: 4,
      label: 'Dysphagia Screening',
      met: kpiSummary.kpiPerformance.kpi4.met,
      total: kpiSummary.kpiPerformance.kpi4.total,
      percentage: kpiSummary.kpiPerformance.kpi4.percentage,
    },
    {
      number: 5,
      label: 'Early Mobilization',
      met: kpiSummary.kpiPerformance.kpi5.met,
      total: kpiSummary.kpiPerformance.kpi5.total,
      percentage: kpiSummary.kpiPerformance.kpi5.percentage,
    },
    {
      number: 6,
      label: 'Secondary Prevention',
      met: kpiSummary.kpiPerformance.kpi6.met,
      total: kpiSummary.kpiPerformance.kpi6.total,
      percentage: kpiSummary.kpiPerformance.kpi6.percentage,
    },
    {
      number: 7,
      label: 'Discharge Planning',
      met: kpiSummary.kpiPerformance.kpi7.met,
      total: kpiSummary.kpiPerformance.kpi7.total,
      percentage: kpiSummary.kpiPerformance.kpi7.percentage,
    },
    {
      number: 8,
      label: 'Follow-up Arranged',
      met: kpiSummary.kpiPerformance.kpi8.met,
      total: kpiSummary.kpiPerformance.kpi8.total,
      percentage: kpiSummary.kpiPerformance.kpi8.percentage,
    },
  ];

  const getPerformanceColor = (percentage: number): 'success' | 'warning' | 'error' => {
    if (percentage >= 80) return 'success';
    if (percentage >= 60) return 'warning';
    return 'error';
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Key Performance Indicators
        </Typography>
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>KPI</TableCell>
                <TableCell align="center">Met</TableCell>
                <TableCell align="center">Total</TableCell>
                <TableCell align="center">Performance</TableCell>
                <TableCell align="center">Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {kpiData.map((kpi) => (
                <TableRow key={kpi.number}>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      KPI {kpi.number}: {kpi.label}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2" fontWeight="medium">
                      {kpi.met}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2">
                      {kpi.total}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: '100%', mr: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={kpi.percentage}
                          color={getPerformanceColor(kpi.percentage)}
                          sx={{ height: 8, borderRadius: 4 }}
                        />
                      </Box>
                      <Typography variant="body2" sx={{ minWidth: 35 }}>
                        {Math.round(kpi.percentage)}%
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={kpi.percentage >= 80 ? 'Good' : kpi.percentage >= 60 ? 'Fair' : 'Poor'}
                      color={getPerformanceColor(kpi.percentage)}
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};

export default KPIPerformanceTable;
