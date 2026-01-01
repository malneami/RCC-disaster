import React from 'react';
import { Card, CardContent, Box, Typography, Chip, LinearProgress } from '@mui/material';
import { KPIMetric } from '../../../types/dataQuality';

interface KPICardProps {
  metric: KPIMetric;
  title: string;
  titleAr?: string;
  description?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
}

const KPICard: React.FC<KPICardProps> = ({ metric, title, titleAr, description, icon, onClick }) => {
  const getStatusColor = (status: string): 'success' | 'warning' | 'error' => {
    switch (status) {
      case 'PASS':
        return 'success';
      case 'WARNING':
        return 'warning';
      case 'FAIL':
        return 'error';
      default:
        return 'warning';
    }
  };

  const getBorderColor = (status: string): string => {
    switch (status) {
      case 'PASS':
        return 'success.main';
      case 'WARNING':
        return 'warning.main';
      case 'FAIL':
        return 'error.main';
      default:
        return 'grey.300';
    }
  };

  return (
    <Card
      sx={{
        borderLeft: 4,
        borderColor: getBorderColor(metric.status),
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease-in-out',
        '&:hover': onClick ? { boxShadow: 4, transform: 'translateY(-2px)' } : {},
        height: '100%',
      }}
      onClick={onClick}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
            {icon && (
              <Box
                sx={{
                  color: getBorderColor(metric.status),
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {icon}
              </Box>
            )}
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" component="div">
                {title}
              </Typography>
              {titleAr && (
                <Typography variant="body2" color="text.secondary" sx={{ direction: 'rtl', mt: 0.5 }}>
                  {titleAr}
                </Typography>
              )}
            </Box>
          </Box>
          <Chip label={metric.status} color={getStatusColor(metric.status)} size="small" />
        </Box>

        {description && (
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
            {description}
          </Typography>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography
            variant="h4"
            sx={{
              color: getBorderColor(metric.status),
              fontWeight: 'bold',
            }}
          >
            {metric.percentage.toFixed(1)}%
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {metric.validRecords}/{metric.totalRecords} valid
          </Typography>
        </Box>

        <LinearProgress
          variant="determinate"
          value={Math.min(metric.percentage, 100)}
          color={getStatusColor(metric.status)}
          sx={{ height: 8, borderRadius: 4, mb: 1 }}
        />

        <Typography variant="caption" color="text.secondary">
          {metric.invalidRecords} invalid records
        </Typography>
      </CardContent>
    </Card>
  );
};

export default KPICard;


