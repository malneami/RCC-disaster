import React from 'react';
import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
  Tooltip,
} from '@mui/material';
import {
  Favorite as HeartIcon,
  MedicalServices as PciIcon,
  Warning as MortalityIcon,
  CheckCircle as ComplianceIcon,
  TrendingUp as TrendUpIcon,
  TrendingDown as TrendDownIcon,
  Dashboard as OverviewIcon,
} from '@mui/icons-material';
import { CommandCenterData } from '../types';

interface KPIMetricsProps {
  data: CommandCenterData | null;
  language: 'en' | 'ar';
}

// Shared styling constants
const CARD_STYLES = {
  borderRadius: '12px',
  padding: '24px',
  minHeight: '140px',
  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
  },
};

const KPIMetrics: React.FC<KPIMetricsProps> = ({ data, language }) => {
  if (!data) return null;

  const summaryCards = [
    {
      id: 'totalCases',
      value: data.summary.totalCases,
      label: language === 'ar' ? 'إجمالي حالات STEMI' : 'Total STEMI Cases',
      icon: HeartIcon,
      iconColor: '#64b5f6',
      valueColor: '#64b5f6',
      bgGradient: 'linear-gradient(135deg, #1a3a5c 0%, #2a4a6c 100%)',
      tooltip: language === 'ar' ? 'إجمالي حالات STEMI المسجلة في الفترة المحددة' : 'Total STEMI cases registered in the selected period',
    },
    {
      id: 'totalPCI',
      value: data.summary.totalPCI,
      label: language === 'ar' ? 'إجمالي عمليات PCI' : 'Total PCI Procedures',
      icon: PciIcon,
      iconColor: '#81c784',
      valueColor: '#81c784',
      bgGradient: 'linear-gradient(135deg, #1a3c1a 0%, #2d4a2d 100%)',
      tooltip: language === 'ar' ? 'عدد عمليات التداخل التاجي عبر الجلد' : 'Number of Percutaneous Coronary Interventions performed',
    },
    {
      id: 'mortalityRate',
      value: `${Math.round(data.summary.mortalityRate * 10) / 10}%`,
      label: language === 'ar' ? 'معدل الوفيات' : 'Mortality Rate',
      icon: MortalityIcon,
      iconColor: data.summary.mortalityRate <= 5 ? '#81c784' : data.summary.mortalityRate <= 10 ? '#ffb74d' : '#ef5350',
      valueColor: data.summary.mortalityRate <= 5 ? '#81c784' : data.summary.mortalityRate <= 10 ? '#ffb74d' : '#ef5350',
      bgGradient: data.summary.mortalityRate <= 5 
        ? 'linear-gradient(135deg, #1a3c1a 0%, #2d4a2d 100%)'
        : data.summary.mortalityRate <= 10 
          ? 'linear-gradient(135deg, #3c3a1a 0%, #4a3c2a 100%)'
          : 'linear-gradient(135deg, #3c1a1a 0%, #4a2d2d 100%)',
      tooltip: language === 'ar' ? 'نسبة الوفيات من إجمالي الحالات (الهدف: ≤5%)' : 'Percentage of deaths from total cases (Target: ≤5%)',
      trend: data.summary.mortalityRate <= 5 ? 'good' : 'bad',
    },
    {
      id: 'complianceRate',
      value: `${Math.round(data.summary.complianceRate * 10) / 10}%`,
      label: language === 'ar' ? 'معدل الامتثال' : 'Overall Compliance',
      icon: ComplianceIcon,
      iconColor: data.summary.complianceRate >= 90 ? '#81c784' : data.summary.complianceRate >= 75 ? '#ffb74d' : '#ef5350',
      valueColor: data.summary.complianceRate >= 90 ? '#81c784' : data.summary.complianceRate >= 75 ? '#ffb74d' : '#ef5350',
      bgGradient: data.summary.complianceRate >= 90 
        ? 'linear-gradient(135deg, #1a3c1a 0%, #2d4a2d 100%)'
        : data.summary.complianceRate >= 75 
          ? 'linear-gradient(135deg, #3c3a1a 0%, #4a3c2a 100%)'
          : 'linear-gradient(135deg, #3c1a1a 0%, #4a2d2d 100%)',
      tooltip: language === 'ar' ? 'متوسط الامتثال لجميع مؤشرات الأداء الرئيسية' : 'Average compliance across all key performance indicators',
      trend: data.summary.complianceRate >= 90 ? 'good' : data.summary.complianceRate >= 75 ? 'neutral' : 'bad',
    },
  ];

  return (
    <Box sx={{ mb: 4 }}>
      {/* Section Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <OverviewIcon sx={{ color: '#64b5f6', fontSize: 28 }} />
        <Typography variant="h5" sx={{ color: '#ffffff', fontWeight: 600 }}>
          {language === 'ar' ? 'نظرة عامة' : 'Overview'}
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {summaryCards.map((card) => {
          const IconComponent = card.icon;
          return (
            <Grid item xs={12} sm={6} md={3} key={card.id}>
              <Tooltip title={card.tooltip} arrow placement="top">
                <Card 
                  sx={{ 
                    ...CARD_STYLES,
                    background: card.bgGradient,
                    border: '1px solid rgba(255,255,255,0.1)',
                    cursor: 'pointer',
                  }}
                >
                  <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
                    {/* Icon and Trend Row */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box 
                        sx={{ 
                          backgroundColor: 'rgba(255,255,255,0.1)', 
                          borderRadius: '10px', 
                          p: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <IconComponent sx={{ color: card.iconColor, fontSize: 28 }} />
                      </Box>
                      {card.trend && (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {card.trend === 'good' ? (
                            <TrendUpIcon sx={{ color: '#81c784', fontSize: 20 }} />
                          ) : card.trend === 'bad' ? (
                            <TrendDownIcon sx={{ color: '#ef5350', fontSize: 20 }} />
                          ) : null}
                        </Box>
                      )}
                    </Box>

                    {/* Value */}
                    <Typography 
                      variant="h3" 
                      sx={{ 
                        color: card.valueColor, 
                        fontWeight: 700,
                        fontSize: '2.5rem',
                        lineHeight: 1.2,
                        mb: 1,
                      }}
                    >
                      {card.value}
                    </Typography>

                    {/* Label */}
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        color: 'rgba(255,255,255,0.7)',
                        fontSize: '0.95rem',
                        fontWeight: 500,
                      }}
                    >
                      {card.label}
                    </Typography>
                  </CardContent>
                </Card>
              </Tooltip>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};

export default KPIMetrics;
