import React from 'react';
import {
  Paper,
  Grid,
  Typography,
  Card,
  CardContent,
  Box,
} from '@mui/material';
import {
  Psychology as BrainIcon,
  CalendarMonth as CalendarIcon,
  TrendingUp as TrendingIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import { StrokeCommandCenterData } from '../types';

interface KPICardsProps {
  data: StrokeCommandCenterData | null;
  language: 'en' | 'ar';
}

const StrokeKPICards: React.FC<KPICardsProps> = ({ data, language }) => {
  if (!data) return null;

  const kpiCards = [
    {
      title: language === 'ar' ? 'إجمالي حالات السكتة الدماغية' : 'Total Stroke Cases',
      value: data.kpiData.totalCases,
      icon: <BrainIcon sx={{ fontSize: 40, color: '#64b5f6' }} />,
      color: '#64b5f6',
      bgColor: '#2a3f5f',
    },
    {
      title: language === 'ar' ? 'حالات هذا الشهر' : 'Cases This Month',
      value: data.kpiData.casesThisMonth,
      icon: <CalendarIcon sx={{ fontSize: 40, color: '#81c784' }} />,
      color: '#81c784',
      bgColor: '#2d4a2d',
    },
    {
      title: language === 'ar' ? 'معدل التغطية' : 'Coverage Rate',
      value: `${Math.round(data.kpiData.coverageRate * 10) / 10}%`,
      icon: <TrendingIcon sx={{ fontSize: 40, color: '#ffb74d' }} />,
      color: '#ffb74d',
      bgColor: '#4a3c2a',
    },
    {
      title: language === 'ar' ? 'أداء السكتة الدماغية' : 'Stroke Performance',
      value: `${Math.round(data.kpiData.strokePerformance * 10) / 10}%`,
      icon: <AssessmentIcon sx={{ fontSize: 40, color: '#ba68c8' }} />,
      color: '#ba68c8',
      bgColor: '#4a2d4a',
    },
  ];

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
        {kpiCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card sx={{ 
              backgroundColor: card.bgColor,
              border: '1px solid #444444',
              height: '100%',
              transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: `0 8px 25px ${card.color}40`,
              },
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Box
                    sx={{
                      backgroundColor: `${card.color}20`,
                      borderRadius: '50%',
                      width: 60,
                      height: 60,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {card.icon}
                  </Box>
                  <Typography
                    variant="h3"
                    component="div"
                    sx={{
                      fontWeight: 'bold',
                      color: card.color,
                    }}
                  >
                    {card.value}
                  </Typography>
                </Box>
                <Typography
                  variant="body2"
                  sx={{
                    color: '#b0b0b0',
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  {card.title}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
};

export default StrokeKPICards;
