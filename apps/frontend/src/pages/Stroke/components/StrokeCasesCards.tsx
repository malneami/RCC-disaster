import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
  Grid,
  LinearProgress,
  Divider,
  Collapse,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { StrokeCase } from '../../../services/strokeService';
import UnifiedCaseCard, { 
  UnifiedCaseCardProps, 
  PatientInfo, 
  TimeMetric, 
  PerformanceIndicator, 
  CaseAction 
} from '../../../components/Common/UnifiedCaseCard';

interface StrokeCasesCardsProps {
  cases: StrokeCase[];
  loading: boolean;
  onUpdateCase: (id: string, data: any) => Promise<void>;
  onCreateCase: () => void;
  onDeleteCase?: (id: string) => Promise<void>;
  onViewDetails: (case_: StrokeCase) => void;
  onEditCase: (case_: StrokeCase) => void;
  onOpenOutcomeForm: (case_: StrokeCase) => void;
  isAdmin?: boolean;
}

const StrokeCasesCards: React.FC<StrokeCasesCardsProps> = ({
  cases,
  loading,
  onUpdateCase,
  onCreateCase,
  onDeleteCase,
  onViewDetails,
  onEditCase,
  onOpenOutcomeForm,
  isAdmin = false,
}) => {
  const transformStrokeCase = (strokeCase: StrokeCase): UnifiedCaseCardProps => {
    const patient: PatientInfo = {
      name: `${strokeCase.patient?.firstName || ''} ${strokeCase.patient?.lastName || ''}`.trim(),
      age: strokeCase.patient?.age || 0,
      gender: strokeCase.patient?.gender || 'MALE',
      id: strokeCase.id,
      nationalId: strokeCase.patient?.nationalId,
      mrn: strokeCase.patient?.mrn,
      admissionDate: strokeCase.createdAt,
      modeOfArrival: strokeCase.modeOfArrival,
    };

    // Calculate targets met
    const targetsMet = calculateTargetsMet(strokeCase);
    
    // Performance indicators
    const performanceIndicators: PerformanceIndicator[] = [
      {
        label: strokeCase.strokeType,
        met: true,
        color: strokeCase.strokeType === 'ISCHEMIC' ? 'info' : 'error',
      },
      {
        label: strokeCase.currentStatus.replace(/_/g, ' '),
        met: strokeCase.currentStatus !== 'PENDING',
        color: getStatusColor(strokeCase.currentStatus),
      },
    ];

    // Time metrics
    const timeMetrics: TimeMetric[] = [
      {
        label: 'Door to Physician',
        value: strokeCase.doorToPhysicianMinutes || 'N/A',
        target: '≤15min',
        unit: 'min',
        met: !strokeCase.doorToPhysicianMinutes || strokeCase.doorToPhysicianMinutes <= 15,
        percentage: strokeCase.doorToPhysicianMinutes ? (strokeCase.doorToPhysicianMinutes / 15) * 100 : undefined,
      },
      {
        label: 'Door to CT',
        value: strokeCase.doorToCtMinutes || 'N/A',
        target: '≤25min',
        unit: 'min',
        met: !strokeCase.doorToCtMinutes || strokeCase.doorToCtMinutes <= 25,
        percentage: strokeCase.doorToCtMinutes ? (strokeCase.doorToCtMinutes / 25) * 100 : undefined,
      },
      {
        label: 'Door to CT Report',
        value: strokeCase.doorToCtReportMinutes || 'N/A',
        target: '≤30min',
        unit: 'min',
        met: !strokeCase.doorToCtReportMinutes || strokeCase.doorToCtReportMinutes <= 30,
        percentage: strokeCase.doorToCtReportMinutes ? (strokeCase.doorToCtReportMinutes / 30) * 100 : undefined,
      },
    ];

    // Data completeness
    const dataCompleteness = calculateDataCompleteness(strokeCase);

    // Case details
    const caseDetails = {
      'mRS Score': strokeCase.mrsBaseline || 'N/A',
      'NIHSS Score': strokeCase.nihssBaseline || 'N/A',
      'Referral To': strokeCase.referralDestination || 'N/A',
    };

    // Actions
    const actions: CaseAction[] = [
      {
        label: 'View Details',
        icon: <ViewIcon />,
        onClick: () => onViewDetails(strokeCase),
        color: 'primary',
        variant: 'outlined',
      },
      {
        label: 'Edit Case',
        icon: <EditIcon />,
        onClick: () => onEditCase(strokeCase),
        color: 'secondary',
        variant: 'outlined',
      },
      {
        label: 'Delete Case',
        icon: <DeleteIcon />,
        onClick: () => onDeleteCase(strokeCase.id),
        color: 'error',
        variant: 'outlined',
      },
    ];

    // Expandable content
    const expandableContent = (
      <Box>
        <Typography variant="subtitle2" gutterBottom>
          Treatment Information
        </Typography>
        <Grid container spacing={2} mb={2}>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Thrombolysis Eligible: {strokeCase.eligibleForThrombolysis ? 'Yes' : 'No'}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Thrombectomy Eligible: {strokeCase.eligibleForThrombectomy ? 'Yes' : 'No'}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Thrombolysis Contraindication: {strokeCase.thrombolysisContraindications ? 'Yes' : 'No'}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Selected Treatment: {strokeCase.selectedTreatment || 'N/A'}
            </Typography>
          </Grid>
        </Grid>
        
        <Divider sx={{ my: 2 }} />
        
        <Typography variant="subtitle2" gutterBottom>
          Key Performance Indicators
        </Typography>
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
      </Box>
    );

    return {
      patient,
      caseId: strokeCase.id,
      caseType: 'stroke' as const,
      status: strokeCase.currentStatus,
      severity: strokeCase.strokeSeverity,
      targetsMet,
      performanceIndicators,
      timeMetrics,
      dataCompleteness,
      caseDetails,
      actions,
      expandableContent,
    };
  };

  const calculateTargetsMet = (strokeCase: StrokeCase): string => {
    let met = 0;
    let total = 0;

    // Door to Physician (≤15min)
    total++;
    if (strokeCase.doorToPhysicianMinutes && strokeCase.doorToPhysicianMinutes <= 15) {
      met++;
    }

    // Door to CT (≤25min)
    total++;
    if (strokeCase.doorToCtMinutes && strokeCase.doorToCtMinutes <= 25) {
      met++;
    }

    // Door to CT Report (≤30min)
    total++;
    if (strokeCase.doorToCtReportMinutes && strokeCase.doorToCtReportMinutes <= 30) {
      met++;
    }

    return `${met}/${total}`;
  };

  const calculateDataCompleteness = (strokeCase: StrokeCase) => {
    const fields = [
      'strokeType',
      'currentStatus',
      'modeOfArrival',
      'nihssBaseline',
      'mrsBaseline',
      'eligibleForThrombolysis',
      'eligibleForThrombectomy',
      'selectedTreatment',
      'doorToPhysicianMinutes',
      'doorToCtMinutes',
      'doorToCtReportMinutes',
    ];

    const completed = fields.filter(field => {
      const value = (strokeCase as any)[field];
      return value !== null && value !== undefined && value !== '';
    }).length;

    return {
      percentage: Math.round((completed / fields.length) * 100),
      completed,
      total: fields.length,
    };
  };

  const getStatusColor = (status: string): 'success' | 'warning' | 'error' | 'info' => {
    switch (status) {
      case 'COMPLETED':
      case 'DISCHARGED':
        return 'success';
      case 'IN_PROGRESS':
      case 'TREATMENT_INITIATED':
        return 'info';
      case 'PENDING':
      case 'AWAITING_ASSESSMENT':
        return 'warning';
      case 'CRITICAL':
      case 'EXPIRED':
        return 'error';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={4}>
        <Typography>Loading stroke cases...</Typography>
      </Box>
    );
  }

  if (cases.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No stroke cases found
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Create your first stroke case to get started
        </Typography>
        <Button
          variant="contained"
          onClick={onCreateCase}
        >
          Create Stroke Case
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Stroke Cases ({cases.length})
      </Typography>
      
      <Grid container spacing={2}>
        {cases.map((strokeCase) => {
          const transformedCase = transformStrokeCase(strokeCase);
          return (
            <Grid item xs={12} md={6} lg={4} key={transformedCase.caseId}>
              <UnifiedCaseCard {...transformedCase} />
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};

export default StrokeCasesCards;