import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Chip,
  Button,
  LinearProgress,
  Collapse,
  Divider,
  Grid,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';

export interface TimeMetric {
  label: string;
  value: string | number;
  target: string;
  unit: string;
  met: boolean;
  percentage?: number;
}

export interface PerformanceIndicator {
  label: string;
  met: boolean;
  color?: 'success' | 'warning' | 'error' | 'info';
}

export interface CaseAction {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  color?: 'primary' | 'secondary' | 'error' | 'warning';
  variant?: 'contained' | 'outlined' | 'text';
  disabled?: boolean;
}

export interface PatientInfo {
  name: string;
  age: number;
  gender: 'MALE' | 'FEMALE';
  id: string;
  nationalId?: string;
  mrn?: string;
  admissionDate: string;
  modeOfArrival?: string;
}

export interface CaseDetails {
  [key: string]: any;
}

export interface UnifiedCaseCardProps {
  // Patient Information
  patient: PatientInfo;
  
  // Case Information
  caseId: string;
  caseType: 'stroke' | 'trauma' | 'stemi';
  status: string;
  severity?: string;
  
  // Performance Overview
  targetsMet?: string; // e.g., "3/3", "0/1"
  overallScore?: string; // e.g., "100%", "33%"
  performanceIndicators?: PerformanceIndicator[];
  
  // Critical Time Metrics
  timeMetrics?: TimeMetric[];
  
  // Data Completeness
  dataCompleteness?: {
    percentage: number;
    completed: number;
    total: number;
  };
  
  // Case-specific details
  caseDetails?: CaseDetails;
  
  // Actions
  actions: CaseAction[];
  
  // Expandable content
  expandableContent?: React.ReactNode;
  
  // Styling
  variant?: 'default' | 'compact';
  elevation?: number;
}

const UnifiedCaseCard: React.FC<UnifiedCaseCardProps> = ({
  patient,
  caseType,
  status,
  severity,
  targetsMet,
  overallScore,
  performanceIndicators = [],
  timeMetrics = [],
  dataCompleteness,
  caseDetails = {},
  actions,
  expandableContent,
  elevation = 1,
}) => {
  const [expanded, setExpanded] = useState(false);

  const getCaseTypeIcon = () => {
    switch (caseType) {
      case 'stroke':
        return '🧠';
      case 'trauma':
        return '⚠️';
      case 'stemi':
        return '❤️';
      default:
        return '📋';
    }
  };

  const getCaseTypeColor = () => {
    switch (caseType) {
      case 'stroke':
        return '#1976d2';
      case 'trauma':
        return '#d32f2f';
      case 'stemi':
        return '#d32f2f';
      default:
        return '#666';
    }
  };

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('progress') || statusLower.includes('active')) return 'info';
    if (statusLower.includes('completed') || statusLower.includes('discharged')) return 'success';
    if (statusLower.includes('critical') || statusLower.includes('severe')) return 'error';
    if (statusLower.includes('pending') || statusLower.includes('suspected')) return 'warning';
    return 'default';
  };

  const formatTimeValue = (value: string | number, unit: string) => {
    if (value === 'N/A' || value === null || value === undefined) return 'N/A';
    if (typeof value === 'number') {
      if (value < 0) return `${Math.abs(value)}${unit}`;
      return `${value}${unit}`;
    }
    return value;
  };

  const getTimeMetricColor = (met: boolean, percentage?: number) => {
    if (!met) return 'error';
    if (percentage !== undefined && percentage < 0) return 'success'; // Ahead of target
    return 'success';
  };

  const formatPatientName = (name: string) => {
    return name.length > 20 ? `${name.substring(0, 20)}...` : name;
  };

  return (
    <Card 
      elevation={elevation}
      sx={{ 
        mb: 2,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        borderRadius: 2,
        border: `1px solid ${getCaseTypeColor()}20`,
        background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
        '&:hover': {
          elevation: 8,
          transform: 'translateY(-4px)',
          boxShadow: `0 8px 25px ${getCaseTypeColor()}30`,
          border: `1px solid ${getCaseTypeColor()}40`,
        },
      }}
    >
      <CardContent sx={{ pb: 1 }}>
        {/* Header */}
        <Box 
          display="flex" 
          justifyContent="space-between" 
          alignItems="flex-start" 
          mb={2}
          sx={{
            background: `linear-gradient(135deg, ${getCaseTypeColor()}10 0%, ${getCaseTypeColor()}05 100%)`,
            borderRadius: 1,
            p: 1.5,
            border: `1px solid ${getCaseTypeColor()}15`,
            flexWrap: { xs: 'wrap', sm: 'nowrap' },
            gap: 1,
          }}
        >
          <Box display="flex" alignItems="center" gap={1.5} sx={{ minWidth: 0, flex: 1 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${getCaseTypeColor()} 0%, ${getCaseTypeColor()}CC 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.2rem',
                color: 'white',
                boxShadow: `0 2px 8px ${getCaseTypeColor()}40`,
                flexShrink: 0,
              }}
            >
              {getCaseTypeIcon()}
            </Box>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 700, 
                  lineHeight: 1.2,
                  color: 'text.primary',
                  fontSize: { xs: '1rem', sm: '1.1rem' },
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {formatPatientName(patient.name)}
              </Typography>
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ 
                  fontSize: { xs: '0.8rem', sm: '0.85rem' },
                  fontWeight: 500,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {patient.age}Y {patient.gender.toLowerCase()} • {format(new Date(patient.admissionDate), 'MMM dd, HH:mm')}
              </Typography>
            </Box>
          </Box>
          
          <Box 
            display="flex" 
            alignItems="center" 
            gap={1}
            sx={{ 
              flexWrap: 'wrap',
              justifyContent: { xs: 'flex-start', sm: 'flex-end' },
              mt: { xs: 1, sm: 0 },
            }}
          >
            <Chip 
              label={status.replace(/_/g, ' ')} 
              size="small" 
              color={getStatusColor(status) as any}
              sx={{ 
                textTransform: 'capitalize',
                fontWeight: 600,
                fontSize: '0.75rem',
                maxWidth: { xs: '120px', sm: 'none' },
                '& .MuiChip-label': {
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                },
              }}
            />
            {severity && (
              <Chip 
                label={severity} 
                size="small" 
                variant="outlined"
                sx={{ 
                  textTransform: 'capitalize',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  borderColor: getCaseTypeColor(),
                  color: getCaseTypeColor(),
                  maxWidth: { xs: '120px', sm: 'none' },
                  '& .MuiChip-label': {
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  },
                }}
              />
            )}
          </Box>
        </Box>

        {/* Performance Overview */}
        {(targetsMet || overallScore || performanceIndicators.length > 0) && (
          <Box mb={2}>
            <Typography variant="subtitle2" gutterBottom>
              Performance Overview
            </Typography>
            <Box display="flex" alignItems="center" gap={2} mb={1}>
              {targetsMet && (
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="body2" color="text.secondary">
                    Targets Met:
                  </Typography>
                  <Box display="flex" gap={0.5}>
                    {targetsMet.split('/')[0].split('').map((_, index) => (
                      <Box
                        key={index}
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          backgroundColor: index < parseInt(targetsMet.split('/')[0]) ? 'success.main' : 'error.main',
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              )}
              {overallScore && (
                <Typography variant="body2" color="text.secondary">
                  Overall Score: {overallScore}
                </Typography>
              )}
            </Box>
            {performanceIndicators.length > 0 && (
              <Box display="flex" gap={1} flexWrap="wrap">
                {performanceIndicators.map((indicator, index) => (
                  <Chip
                    key={index}
                    label={indicator.label}
                    size="small"
                    color={indicator.color || 'default'}
                    icon={indicator.met ? <CheckCircleIcon /> : <CancelIcon />}
                  />
                ))}
              </Box>
            )}
          </Box>
        )}

        {/* Patient Details */}
        <Box mb={2}>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                ID/Iqamah: {patient.id}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Mode of Arrival: {patient.modeOfArrival || 'N/A'}
              </Typography>
            </Grid>
            {patient.nationalId && (
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  National ID: {patient.nationalId}
                </Typography>
              </Grid>
            )}
            {patient.mrn && (
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  MRN: {patient.mrn}
                </Typography>
              </Grid>
            )}
          </Grid>
        </Box>

        {/* Critical Time Metrics */}
        {timeMetrics.length > 0 && (
          <Box mb={2}>
            <Typography variant="subtitle2" gutterBottom>
              Critical Time Metrics
            </Typography>
            {timeMetrics.map((metric, index) => (
              <Box key={index} mb={1}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                  <Typography variant="body2" color="text.secondary">
                    {metric.label}:
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography 
                      variant="body2" 
                      color={getTimeMetricColor(metric.met, metric.percentage)}
                      sx={{ fontWeight: 'bold' }}
                    >
                      {formatTimeValue(metric.value, metric.unit)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Target: {metric.target}
                    </Typography>
                  </Box>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={metric.percentage ? Math.min(Math.abs(metric.percentage), 100) : 0}
                  color={getTimeMetricColor(metric.met, metric.percentage)}
                  sx={{ height: 6, borderRadius: 3 }}
                />
                <Box display="flex" justifyContent="space-between" alignItems="center" mt={0.5}>
                  <Typography variant="caption" color="text.secondary">
                    {metric.met ? '✓ Target Met' : '✗ Target Missed'}
                  </Typography>
                  {metric.percentage !== undefined && (
                    <Typography variant="caption" color="text.secondary">
                      {Math.abs(metric.percentage)}% of target
                    </Typography>
                  )}
                </Box>
              </Box>
            ))}
          </Box>
        )}

        {/* Data Completeness */}
        {dataCompleteness && (
          <Box mb={2}>
            <Typography variant="subtitle2" gutterBottom>
              Data Completeness
            </Typography>
            <Box display="flex" alignItems="center" gap={2}>
              <LinearProgress
                variant="determinate"
                value={dataCompleteness.percentage}
                sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                color={dataCompleteness.percentage >= 90 ? 'success' : dataCompleteness.percentage >= 70 ? 'warning' : 'error'}
              />
              <Typography variant="body2" color="text.secondary">
                {dataCompleteness.completed} of {dataCompleteness.total} fields completed
              </Typography>
              {dataCompleteness.percentage >= 90 ? (
                <CheckCircleIcon color="success" fontSize="small" />
              ) : (
                <WarningIcon color="warning" fontSize="small" />
              )}
            </Box>
          </Box>
        )}

        {/* Case Details */}
        {Object.keys(caseDetails).length > 0 && (
          <Box mb={2}>
            <Grid container spacing={2}>
              {Object.entries(caseDetails).map(([key, value]) => (
                <Grid item xs={6} key={key}>
                  <Typography variant="body2" color="text.secondary">
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}: {value || 'N/A'}
                  </Typography>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </CardContent>

      {/* Actions */}
      <CardActions sx={{ pt: 0, pb: 1 }}>
        <Box display="flex" gap={1} flexWrap="wrap">
          {actions.map((action, index) => (
            <Button
              key={index}
              size="small"
              startIcon={action.icon}
              onClick={action.onClick}
              color={action.color || 'primary'}
              variant={action.variant || 'outlined'}
              disabled={action.disabled}
            >
              {action.label}
            </Button>
          ))}
        </Box>
      </CardActions>

      {/* Expandable Content */}
      {expandableContent && (
        <>
          <Divider />
          <Box display="flex" justifyContent="center" py={1}>
            <Button
              size="small"
              onClick={() => setExpanded(!expanded)}
              endIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            >
              {expanded ? 'Hide Details' : 'Show Details'}
            </Button>
          </Box>
          <Collapse in={expanded}>
            <CardContent sx={{ pt: 0 }}>
              {expandableContent}
            </CardContent>
          </Collapse>
        </>
      )}
    </Card>
  );
};

export default UnifiedCaseCard;
