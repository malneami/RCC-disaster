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
  Avatar,
  Tooltip,
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Schedule,
  LocalHospital,
  Accessibility,
  Medication,
  Assignment,
} from '@mui/icons-material';

import { StrokeKPISummary } from '../../../../services/strokeService';

interface KPIPerformanceTableProps {
  kpiSummary: StrokeKPISummary;
}

const KPIPerformanceTable: React.FC<KPIPerformanceTableProps> = ({ kpiSummary }) => {
  const kpiData = [
    {
      number: 1,
      label: 'Door to Imaging',
      description: 'Time from arrival to imaging ≤25min',
      icon: <Schedule />,
      met: kpiSummary.kpiPerformance.kpi1.met,
      total: kpiSummary.kpiPerformance.kpi1.total,
      percentage: kpiSummary.kpiPerformance.kpi1.percentage,
      target: '≤25min',
    },
    {
      number: 2,
      label: 'Door to Needle',
      description: 'Time from arrival to thrombolysis ≤60min',
      icon: <Medication />,
      met: kpiSummary.kpiPerformance.kpi2.met,
      total: kpiSummary.kpiPerformance.kpi2.total,
      percentage: kpiSummary.kpiPerformance.kpi2.percentage,
      target: '≤60min',
    },
    {
      number: 3,
      label: 'Door to Groin',
      description: 'Time from arrival to thrombectomy ≤90min',
      icon: <LocalHospital />,
      met: kpiSummary.kpiPerformance.kpi3.met,
      total: kpiSummary.kpiPerformance.kpi3.total,
      percentage: kpiSummary.kpiPerformance.kpi3.percentage,
      target: '≤90min',
    },
    {
      number: 4,
      label: 'Stroke Unit Admission',
      description: 'Admission to stroke unit ≤4hr',
      icon: <LocalHospital />,
      met: kpiSummary.kpiPerformance.kpi4.met,
      total: kpiSummary.kpiPerformance.kpi4.total,
      percentage: kpiSummary.kpiPerformance.kpi4.percentage,
      target: '≤4hr',
    },
    {
      number: 5,
      label: 'Dysphagia Screening',
      description: 'Dysphagia screening ≤4hr',
      icon: <Accessibility />,
      met: kpiSummary.kpiPerformance.kpi5.met,
      total: kpiSummary.kpiPerformance.kpi5.total,
      percentage: kpiSummary.kpiPerformance.kpi5.percentage,
      target: '≤4hr',
    },
    {
      number: 6,
      label: 'Early Mobilization',
      description: 'Early mobilization ≤24hr',
      icon: <Accessibility />,
      met: kpiSummary.kpiPerformance.kpi6.met,
      total: kpiSummary.kpiPerformance.kpi6.total,
      percentage: kpiSummary.kpiPerformance.kpi6.percentage,
      target: '≤24hr',
    },
    {
      number: 7,
      label: 'Secondary Prevention',
      description: 'Secondary prevention prescribed',
      icon: <Medication />,
      met: kpiSummary.kpiPerformance.kpi7.met,
      total: kpiSummary.kpiPerformance.kpi7.total,
      percentage: kpiSummary.kpiPerformance.kpi7.percentage,
      target: '100%',
    },
    {
      number: 8,
      label: 'Rehabilitation Referral',
      description: 'Appropriate rehabilitation referral',
      icon: <Assignment />,
      met: kpiSummary.kpiPerformance.kpi8.met,
      total: kpiSummary.kpiPerformance.kpi8.total,
      percentage: kpiSummary.kpiPerformance.kpi8.percentage,
      target: '100%',
    },
  ];

  const getPerformanceColor = (percentage: number): 'success' | 'warning' | 'error' => {
    if (percentage >= 80) return 'success';
    if (percentage >= 60) return 'warning';
    return 'error';
  };

  const getPerformanceIcon = (percentage: number) => {
    if (percentage >= 80) return <CheckCircle color="success" />;
    if (percentage >= 60) return <Schedule color="warning" />;
    return <Cancel color="error" />;
  };

  return (
    <Card sx={{ boxShadow: 3 }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" fontWeight="bold" sx={{ mr: 2 }}>
            Key Performance Indicators
          </Typography>
          <Chip 
            label={`${kpiData.filter(kpi => kpi.percentage >= 80).length}/${kpiData.length} KPIs Met`}
            color="primary"
            variant="outlined"
          />
        </Box>
        
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell sx={{ fontWeight: 'bold', py: 2 }}>KPI</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', py: 2 }}>Target</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', py: 2 }}>Performance</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', py: 2 }}>Status</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', py: 2 }}>Details</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {kpiData.map((kpi) => (
                <TableRow 
                  key={kpi.number}
                  sx={{ 
                    '&:hover': { bgcolor: 'grey.50' },
                    '&:last-child td': { borderBottom: 0 }
                  }}
                >
                  <TableCell sx={{ py: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar 
                        sx={{ 
                          bgcolor: getPerformanceColor(kpi.percentage) === 'success' ? 'success.light' : 
                                  getPerformanceColor(kpi.percentage) === 'warning' ? 'warning.light' : 'error.light',
                          color: 'white',
                          width: 40,
                          height: 40
                        }}
                      >
                        {kpi.icon}
                      </Avatar>
                      <Box>
                        <Typography variant="body1" fontWeight="medium">
                          KPI {kpi.number}: {kpi.label}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {kpi.description}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  
                  <TableCell align="center" sx={{ py: 2 }}>
                    <Chip 
                      label={kpi.target}
                      size="small"
                      variant="outlined"
                      color="info"
                    />
                  </TableCell>
                  
                  <TableCell align="center" sx={{ py: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 120 }}>
                      <Box sx={{ width: '100%', mr: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={kpi.percentage}
                          color={getPerformanceColor(kpi.percentage)}
                          sx={{ 
                            height: 8, 
                            borderRadius: 4,
                            bgcolor: 'grey.200'
                          }}
                        />
                      </Box>
                      <Typography variant="body2" fontWeight="medium" sx={{ minWidth: 35 }}>
                        {Math.round(kpi.percentage)}%
                      </Typography>
                    </Box>
                  </TableCell>
                  
                  <TableCell align="center" sx={{ py: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                      {getPerformanceIcon(kpi.percentage)}
                      <Chip
                        label={kpi.percentage >= 80 ? 'Excellent' : kpi.percentage >= 60 ? 'Good' : 'Needs Improvement'}
                        color={getPerformanceColor(kpi.percentage)}
                        size="small"
                        variant="filled"
                      />
                    </Box>
                  </TableCell>
                  
                  <TableCell align="center" sx={{ py: 2 }}>
                    <Tooltip title={`${kpi.met} out of ${kpi.total} cases met this KPI`}>
                      <Typography variant="body2" color="text.secondary">
                        {kpi.met}/{kpi.total}
                      </Typography>
                    </Tooltip>
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
