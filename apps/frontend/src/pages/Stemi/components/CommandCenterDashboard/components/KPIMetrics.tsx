import React from 'react';
import {
  Paper,
  Grid,
  Typography,
  Card,
  CardContent,
} from '@mui/material';
import { CommandCenterData } from '../types';

interface KPIMetricsProps {
  data: CommandCenterData | null;
  language: 'en' | 'ar';
}

const KPIMetrics: React.FC<KPIMetricsProps> = ({ data, language }) => {
  if (!data) return null;

  return (
    <Paper 
      elevation={2} 
      sx={{ 
        p: 3, 
        mb: 3,
        backgroundColor: '#1e1e1e',
        color: '#ffffff',
        border: '1px solid #333333'
      }}
    >
      <Typography variant="h6" gutterBottom sx={{ mb: 3, color: '#ffffff' }}>
        {language === 'ar' ? 'مؤشرات الأداء الرئيسية' : 'Key Performance Indicators'}
      </Typography>

      <Grid container spacing={3}>
        {/* Summary Cards */}
        <Grid item xs={12}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ 
                backgroundColor: '#2a3f5f',
                border: '1px solid #444444'
              }}>
                <CardContent>
                  <Typography variant="h4" sx={{ color: '#64b5f6', fontWeight: 'bold' }}>
                    {data.summary.totalCases}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#b0b0b0' }}>
                    {language === 'ar' ? 'إجمالي حالات STEMI' : 'Total STEMI Cases'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ 
                backgroundColor: '#2d4a2d',
                border: '1px solid #444444'
              }}>
                <CardContent>
                  <Typography variant="h4" sx={{ color: '#81c784', fontWeight: 'bold' }}>
                    {data.summary.totalPCI}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#b0b0b0' }}>
                    {language === 'ar' ? 'إجمالي عمليات PCI' : 'Total PCI Procedures'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ 
                backgroundColor: '#4a3c2a',
                border: '1px solid #444444'
              }}>
                <CardContent>
                  <Typography variant="h4" sx={{ color: '#ffb74d', fontWeight: 'bold' }}>
                    {Math.round(data.summary.mortalityRate * 10) / 10}%
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#b0b0b0' }}>
                    {language === 'ar' ? 'معدل الوفيات' : 'Mortality Rate'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ 
                backgroundColor: '#4a2d4a',
                border: '1px solid #444444'
              }}>
                <CardContent>
                  <Typography variant="h4" sx={{ color: '#ba68c8', fontWeight: 'bold' }}>
                    {Math.round(data.summary.complianceRate * 10) / 10}%
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#b0b0b0' }}>
                    {language === 'ar' ? 'معدل الامتثال' : 'Compliance Rate'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default KPIMetrics;
