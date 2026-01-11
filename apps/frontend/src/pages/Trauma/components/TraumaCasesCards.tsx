import React, { useState } from 'react';
import {
  Box,
  Grid,
  Typography,
  TablePagination,
  Paper,
  CircularProgress,
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Comment as CommentIcon,
  AccessTime as AccessTimeIcon,
  MedicalServices as MedicalServicesIcon,
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
import CaseNoteModal from '../../../pages/NotificationCenter/components/CaseNoteModal';
import { notificationService } from '../../../services/notificationService';

interface TraumaCasesCardsProps {
  cases: TraumaCase[];
  totalCount: number;
  page: number;
  rowsPerPage: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rowsPerPage: number) => void;
  onCreateCase: () => void;
  onDeleteCase: (id: string) => Promise<void>;
  onUpdateCase: (id: string, data: any) => Promise<void>;
  onViewDetails: (case_: TraumaCase) => void;
  onEditCase: (case_: TraumaCase) => void;
  isAdmin: boolean;
  loading?: boolean;
}

const TraumaCasesCards: React.FC<TraumaCasesCardsProps> = ({
  cases,
  totalCount,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  onDeleteCase,
  onViewDetails,
  onEditCase,
  loading = false,
}) => {
  const [showCaseNoteModal, setShowCaseNoteModal] = useState(false);
  const [selectedCaseForNote, setSelectedCaseForNote] = useState<TraumaCase | null>(null);

  const handleAddCaseNote = (traumaCase: TraumaCase) => {
    setSelectedCaseForNote(traumaCase);
    setShowCaseNoteModal(true);
  };

  const handleCaseNoteSubmit = async (data: any) => {
    try {
      await notificationService.createCaseNote(data);
      setShowCaseNoteModal(false);
      setSelectedCaseForNote(null);
    } catch (error) {
      console.error('Error creating case note:', error);
    }
  };

  const handleCaseNoteClose = () => {
    setShowCaseNoteModal(false);
    setSelectedCaseForNote(null);
  };

  const transformTraumaCase = (traumaCase: TraumaCase): UnifiedCaseCardProps => {
    const patient: PatientInfo = {
      name: `${traumaCase.patient?.firstName || ''} ${traumaCase.patient?.lastName || ''}`.trim(),
      age: traumaCase.patient?.age || 0,
      gender: traumaCase.patient?.gender as 'MALE' | 'FEMALE' || 'MALE',
      id: traumaCase.id,
      nationalId: traumaCase.patient?.nationalId,
      mrn: traumaCase.patient?.mrn,
      admissionDate: traumaCase.arrivalDateTime,
      originHospital: traumaCase.originHospital?.name || 'N/A',
      destinationHospital: traumaCase.destinationHospital?.name || 'N/A',
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
        color: getDispositionColor(traumaCase.edDisposition || null),
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
        label: 'Add Case Note',
        icon: <CommentIcon />,
        onClick: () => handleAddCaseNote(traumaCase),
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

    // Helper function for formatting timestamps
    const formatTimestamp = (timestamp: string | undefined | null): string => {
      if (!timestamp) return '—';
      try {
        return format(new Date(timestamp), 'dd MMM yyyy, HH:mm');
      } catch {
        return '—';
      }
    };

    // DataRow component for consistent styling
    const DataRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
      <Box sx={{ py: 0.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography sx={{ color: '#64748b', fontSize: '0.7rem', fontWeight: 500 }}>
          {label}
        </Typography>
        <Typography sx={{ color: '#0f172a', fontWeight: 700, fontSize: '0.75rem', textAlign: 'right' }}>
          {value}
        </Typography>
      </Box>
    );

    // Expandable content with chronological timestamps
    const expandableContent = (
      <Box sx={{ pt: 1 }}>
        <Grid container spacing={1.5}>
          {/* Critical Timestamps - Left Column */}
          <Grid item xs={12} md={6}>
            <Box sx={{ bgcolor: '#f8fafc', borderRadius: 1, p: 1.5, border: '1px solid #e2e8f0' }}>
              <Box display="flex" alignItems="center" gap={0.75} mb={1}>
                <AccessTimeIcon sx={{ color: '#3b82f6', fontSize: 16 }} />
                <Typography sx={{ fontWeight: 700, color: '#1e293b', fontSize: '0.75rem' }}>
                  Critical Timestamps
                </Typography>
              </Box>
              <DataRow label="Incident Time" value={formatTimestamp(traumaCase.incidentDateTime)} />
              <DataRow label="Arrival Time" value={formatTimestamp(traumaCase.arrivalDateTime)} />
              <DataRow label="Response Time" value={traumaCase.responseTimeMinutes ? `${traumaCase.responseTimeMinutes} min` : '—'} />
              <DataRow label="Transfer Request" value={formatTimestamp(traumaCase.transferRequestDateTime)} />
              <DataRow label="Transfer Arrival" value={formatTimestamp(traumaCase.transferArrivalDateTime)} />
              <DataRow label="Transfer Duration" value={traumaCase.transferDurationMinutes ? `${traumaCase.transferDurationMinutes} min` : '—'} />
            </Box>
          </Grid>

          {/* Injury Assessment - Right Column */}
          <Grid item xs={12} md={6}>
            <Box sx={{ bgcolor: '#f8fafc', borderRadius: 1, p: 1.5, border: '1px solid #e2e8f0' }}>
              <Box display="flex" alignItems="center" gap={0.75} mb={1}>
                <MedicalServicesIcon sx={{ color: '#ef4444', fontSize: 16 }} />
                <Typography sx={{ fontWeight: 700, color: '#1e293b', fontSize: '0.75rem' }}>
                  Injury Assessment
                </Typography>
              </Box>
              <DataRow label="GCS Score" value={traumaCase.glasgowComaScale || 'N/A'} />
              <DataRow label="Systolic BP" value={traumaCase.systolicBloodPressure ? `${traumaCase.systolicBloodPressure} mmHg` : 'N/A'} />
              <DataRow label="Respiratory Rate" value={traumaCase.respiratoryRate ? `${traumaCase.respiratoryRate} /min` : 'N/A'} />
              <DataRow label="Critical Case" value={traumaCase.criticalCase ? 'Yes' : 'No'} />
              <DataRow label="Transfer Case" value={traumaCase.transferCase ? 'Yes' : 'No'} />
              <DataRow label="ED Disposition" value={traumaCase.edDisposition || 'N/A'} />
            </Box>
          </Grid>
        </Grid>
      </Box>
    );

    return {
      patient,
      caseId: traumaCase.id,
      caseType: 'trauma' as const,
      status: traumaCase.edDisposition || 'UNKNOWN',
      severity: getInjurySeverity(traumaCase),
      pathway: 'TRAUMA', // Default to TRAUMA pathway for trauma cases
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
    if (!disposition) return 'info';
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
        return 'info';
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
    ].filter(injury => injury);

    if (injuries.some(injury => injury === 'SEVERE' || injury === 'CRITICAL')) {
      return 'Severe';
    }
    if (injuries.some(injury => injury === 'MODERATE')) {
      return 'Moderate';
    }
    return 'Minor';
  };



  const getDaysAgo = (dateString: string): string => {
    const days = Math.floor((Date.now() - new Date(dateString).getTime()) / (1000 * 60 * 60 * 24));
    return `${days} days ago`;
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    onPageChange(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    onRowsPerPageChange(newRowsPerPage);
    onPageChange(0);
  };

  if (loading && cases.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (cases.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No trauma cases found
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Grid container spacing={2}>
        {cases.map((traumaCase) => {
          const transformedCase = transformTraumaCase(traumaCase);
          return (
            <Grid item xs={12} md={6} lg={6} key={transformedCase.caseId}>
              <UnifiedCaseCard {...transformedCase} />
            </Grid>
          );
        })}
      </Grid>

      {/* Pagination */}
      <Box sx={{ mt: 3 }}>
        <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
          <TablePagination
            rowsPerPageOptions={[10, 20, 30, 50]}
            component="div"
            count={totalCount}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Cards per page:"
          />
        </Paper>
      </Box>

      {/* Case Note Modal */}
      {selectedCaseForNote && (
        <CaseNoteModal
          open={showCaseNoteModal}
          onClose={handleCaseNoteClose}
          onSubmit={handleCaseNoteSubmit}
          patientName={`${selectedCaseForNote.patient?.firstName || ''} ${selectedCaseForNote.patient?.lastName || ''}`.trim()}
          caseType="TRAUMA"
          caseId={selectedCaseForNote.id}
          patientId={selectedCaseForNote.patientId}
          ticketId={selectedCaseForNote.ticketId}
        />
      )}
    </Box>
  );
};

export default TraumaCasesCards;