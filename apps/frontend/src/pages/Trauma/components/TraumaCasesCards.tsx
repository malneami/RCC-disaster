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
import { TraumaCase, TraumaService } from '../../../services/traumaService';
import UnifiedCaseCard, { 
  UnifiedCaseCardProps, 
  PatientInfo, 
  TimeMetric, 
  PerformanceIndicator, 
  CaseAction 
} from '../../../components/Common/UnifiedCaseCard';

interface TraumaCasesCardsProps {
  cases: TraumaCase[];
  onCreateCase: () => void;
  onDeleteCase: (id: string) => Promise<void>;
  onUpdateCase: (id: string, data: any) => Promise<void>;
  onViewDetails: (case_: TraumaCase) => void;
  onEditCase: (case_: TraumaCase) => void;
  isAdmin: boolean;
}

const TraumaCasesCards: React.FC<TraumaCasesCardsProps> = ({
  cases,
  onCreateCase,
  onDeleteCase,
  onViewDetails,
  onEditCase,
  isAdmin,
}) => {
  const transformTraumaCase = (traumaCase: TraumaCase): UnifiedCaseCardProps => {
    const patient: PatientInfo = {
      name: `${traumaCase.patient?.firstName || ''} ${traumaCase.patient?.lastName || ''}`.trim(),
      age: traumaCase.patient?.age || 0,
      gender: traumaCase.patient?.gender as 'MALE' | 'FEMALE' || 'MALE',
      id: traumaCase.id,
      nationalId: traumaCase.patient?.nationalId,
      mrn: traumaCase.patient?.mrn,
      admissionDate: traumaCase.arrivalDateTime,
      modeOfArrival: traumaCase.modeOfArrival,
    };

    // Calculate targets met based on trauma-specific metrics
    const targetsMet = calculateTargetsMet(traumaCase);
    
    // Performance indicators
    const performanceIndicators: PerformanceIndicator[] = [
      {
        label: traumaCase.mechanismOfInjury.replace(/_/g, ' '),
        met: true,
        color: getMechanismColor(traumaCase.mechanismOfInjury),
      },
      {
        label: traumaCase.edDisposition || 'Unknown',
        met: traumaCase.edDisposition !== null,
        color: getDispositionColor(traumaCase.edDisposition),
      },
    ];

    // Time metrics for trauma cases
    const timeMetrics: TimeMetric[] = [
      {
        label: 'Response Time',
        value: traumaCase.responseTimeMinutes || 'N/A',
        target: '≤15min',
        unit: 'min',
        met: !traumaCase.responseTimeMinutes || traumaCase.responseTimeMinutes <= 15,
        percentage: traumaCase.responseTimeMinutes ? (traumaCase.responseTimeMinutes / 15) * 100 : undefined,
      },
      {
        label: 'Transfer Duration',
        value: traumaCase.transferDurationMinutes || 'N/A',
        target: '≤60min',
        unit: 'min',
        met: !traumaCase.transferDurationMinutes || traumaCase.transferDurationMinutes <= 60,
        percentage: traumaCase.transferDurationMinutes ? (traumaCase.transferDurationMinutes / 60) * 100 : undefined,
      },
    ];

    // Data completeness
    const dataCompleteness = calculateDataCompleteness(traumaCase);

    // Case details
    const caseDetails = {
      'Mechanism': TraumaService.getMechanismOfInjuryLabel(traumaCase.mechanismOfInjury),
      'Severity': getInjurySeverity(traumaCase),
      'Arrival': format(new Date(traumaCase.arrivalDateTime), 'MMM dd, HH:mm'),
      'Mode of Arrival': TraumaService.getModeOfArrivalLabel(traumaCase.modeOfArrival),
      'Registered': getDaysAgo(traumaCase.createdAt),
    };

    // Actions
    const actions: CaseAction[] = [
      {
        label: 'View Details',
        icon: <ViewIcon />,
        onClick: () => onViewDetails(traumaCase),
        color: 'primary',
        variant: 'outlined',
      },
      {
        label: 'Edit Case',
        icon: <EditIcon />,
        onClick: () => onEditCase(traumaCase),
        color: 'secondary',
        variant: 'outlined',
      },
      {
        label: 'Delete Case',
        icon: <DeleteIcon />,
        onClick: () => onDeleteCase(traumaCase.id),
        color: 'error',
        variant: 'outlined',
      },
    ];

    // Expandable content
    const expandableContent = (
      <Box>
        <Typography variant="subtitle2" gutterBottom>
          Injury Assessment
        </Typography>
        <Grid container spacing={2} mb={2}>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              GCS Score: {traumaCase.glasgowComaScale || 'N/A'}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Systolic BP: {traumaCase.systolicBloodPressure || 'N/A'} mmHg
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Respiratory Rate: {traumaCase.respiratoryRate || 'N/A'} /min
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Critical Case: {traumaCase.criticalCase ? 'Yes' : 'No'}
            </Typography>
          </Grid>
        </Grid>
        
        <Divider sx={{ my: 2 }} />
        
        <Typography variant="subtitle2" gutterBottom>
          Body Region Injuries
        </Typography>
        <Box display="flex" gap={1} flexWrap="wrap">
          {getBodyRegionInjuries(traumaCase).map((injury, index) => (
            <Chip
              key={index}
              label={injury}
              size="small"
              color={injury.includes('Severe') || injury.includes('Critical') ? 'error' : 'default'}
            />
          ))}
        </Box>
      </Box>
    );

    return {
      patient,
      caseId: traumaCase.id,
      caseType: 'trauma' as const,
      status: traumaCase.edDisposition || 'UNKNOWN',
      severity: getInjurySeverity(traumaCase),
      targetsMet,
      performanceIndicators,
      timeMetrics,
      dataCompleteness,
      caseDetails,
      actions,
      expandableContent,
    };
  };

  const calculateTargetsMet = (traumaCase: TraumaCase): string => {
    let met = 0;
    let total = 0;

    // Response time target
    total++;
    if (traumaCase.responseTimeMinutes && traumaCase.responseTimeMinutes <= 15) {
      met++;
    }

    // Transfer time target (if applicable)
    if (traumaCase.transferCase) {
      total++;
      if (traumaCase.transferDurationMinutes && traumaCase.transferDurationMinutes <= 60) {
        met++;
      }
    }

    // GCS assessment target
    total++;
    if (traumaCase.glasgowComaScale !== null && traumaCase.glasgowComaScale !== undefined) {
      met++;
    }

    return `${met}/${total}`;
  };

  const calculateDataCompleteness = (traumaCase: TraumaCase) => {
    const fields = [
      'mechanismOfInjury',
      'modeOfArrival',
      'glasgowComaScale',
      'systolicBloodPressure',
      'respiratoryRate',
      'chiefComplaint',
      'edDisposition',
      'headAndNeckInjury',
      'chestInjury',
      'abdomenInjury',
      'extremitiesInjury',
      'externalInjury',
      'faceInjury',
      'primarySurveyFindings',
      'additionalNotes',
      'responseTimeMinutes',
    ];

    const completed = fields.filter(field => {
      const value = (traumaCase as any)[field];
      return value !== null && value !== undefined && value !== '';
    }).length;

    return {
      percentage: Math.round((completed / fields.length) * 100),
      completed,
      total: fields.length,
    };
  };

  const getMechanismColor = (mechanism: string): 'success' | 'warning' | 'error' | 'info' => {
    switch (mechanism) {
      case 'FALL':
      case 'SPORTS_INJURY':
        return 'success';
      case 'MOTOR_VEHICLE_ACCIDENT':
      case 'ASSAULT':
        return 'error';
      case 'PENETRATING_INJURY':
      case 'BURN':
        return 'warning';
      default:
        return 'info';
    }
  };

  const getDispositionColor = (disposition: string | null): 'success' | 'warning' | 'error' | 'info' => {
    if (!disposition) return 'default';
    switch (disposition) {
      case 'DISCHARGED':
        return 'success';
      case 'ADMITTED':
        return 'info';
      case 'TRANSFERRED':
        return 'warning';
      case 'DECEASED':
        return 'error';
      default:
        return 'default';
    }
  };

  const getInjurySeverity = (traumaCase: TraumaCase): string => {
    if (traumaCase.criticalCase) return 'Critical';
    
    const injuries = [
      traumaCase.headAndNeckInjury,
      traumaCase.chestInjury,
      traumaCase.abdomenInjury,
      traumaCase.extremitiesInjury,
      traumaCase.externalInjury,
      traumaCase.faceInjury,
    ].filter(injury => injury && injury !== 'NONE');

    if (injuries.some(injury => injury === 'SEVERE' || injury === 'CRITICAL')) {
      return 'Severe';
    }
    if (injuries.some(injury => injury === 'MODERATE')) {
      return 'Moderate';
    }
    return 'Minor';
  };

  const getBodyRegionInjuries = (traumaCase: TraumaCase): string[] => {
    const injuries = [];
    
    if (traumaCase.headAndNeckInjury && traumaCase.headAndNeckInjury !== 'NONE') {
      injuries.push(`Head/Neck: ${traumaCase.headAndNeckInjury}`);
    }
    if (traumaCase.chestInjury && traumaCase.chestInjury !== 'NONE') {
      injuries.push(`Chest: ${traumaCase.chestInjury}`);
    }
    if (traumaCase.abdomenInjury && traumaCase.abdomenInjury !== 'NONE') {
      injuries.push(`Abdomen: ${traumaCase.abdomenInjury}`);
    }
    if (traumaCase.extremitiesInjury && traumaCase.extremitiesInjury !== 'NONE') {
      injuries.push(`Extremities: ${traumaCase.extremitiesInjury}`);
    }
    if (traumaCase.externalInjury && traumaCase.externalInjury !== 'NONE') {
      injuries.push(`External: ${traumaCase.externalInjury}`);
    }
    if (traumaCase.faceInjury && traumaCase.faceInjury !== 'NONE') {
      injuries.push(`Face: ${traumaCase.faceInjury}`);
    }

    return injuries.length > 0 ? injuries : ['No specific injuries recorded'];
  };

  const getDaysAgo = (dateString: string): string => {
    const days = Math.floor((Date.now() - new Date(dateString).getTime()) / (1000 * 60 * 60 * 24));
    return `${days} days ago`;
  };

  if (cases.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No trauma cases found
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Create your first trauma case to get started
        </Typography>
        <Button
          variant="contained"
          onClick={onCreateCase}
        >
          Create Trauma Case
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Trauma Cases ({cases.length})
      </Typography>
      
      <Grid container spacing={2}>
        {cases.map((traumaCase) => {
          const transformedCase = transformTraumaCase(traumaCase);
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

export default TraumaCasesCards;