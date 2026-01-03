import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  TextField,
  InputAdornment,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  ViewModule as CardsIcon,
  TableChart as TableIcon,
  Comment as CommentIcon,
  Assignment as OutcomeFormIcon,
  AccessTime as AccessTimeIcon,
  MedicalServices as MedicalServicesIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { StrokeCase } from '../../../services/strokeService';
import StrokeCasesFilters from './StrokeCasesList/StrokeCasesFilters';
import UnifiedCaseCard, {
  UnifiedCaseCardProps,
  PatientInfo,
  TimeMetric,
  PerformanceIndicator,
  CaseAction
} from '../../../components/Common/UnifiedCaseCard';
import CaseNoteModal from '../../../pages/NotificationCenter/components/CaseNoteModal';
import { notificationService } from '../../../services/notificationService';

interface StrokeCasesCardsProps {
  cases: StrokeCase[];
  totalCount?: number;
  loading: boolean;
  onUpdateCase: (id: string, data: any) => Promise<void>;
  onCreateCase: () => void;
  onDeleteCase?: (id: string) => Promise<void>;
  onViewDetails: (case_: StrokeCase) => void;
  onEditCase: (case_: StrokeCase) => void;
  onOpenOutcomeForm: (case_: StrokeCase) => void;
  isAdmin?: boolean;
  onViewModeChange?: (mode: 'table' | 'cards') => void;
}

const StrokeCasesCards: React.FC<StrokeCasesCardsProps> = ({
  cases,
  totalCount,
  loading,
  onCreateCase,
  onDeleteCase,
  onViewDetails,
  onEditCase,
  onOpenOutcomeForm,
  onViewModeChange,
}) => {
  const [filteredCases, setFilteredCases] = useState<StrokeCase[]>(cases);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    strokeType: '',
    status: '',
    originHospitalId: '',
    destinationHospitalId: '',
    modeOfArrival: '',
    dateFrom: '',
    dateTo: '',
  });
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [showCaseNoteModal, setShowCaseNoteModal] = useState(false);
  const [selectedCaseForNote, setSelectedCaseForNote] = useState<StrokeCase | null>(null);

  useEffect(() => {
    applyFiltersAndSearch();
  }, [cases, searchQuery, filters]);

  const applyFiltersAndSearch = () => {
    let filtered = cases;

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(case_ => {
        const patient = case_.patient;
        if (!patient) return false;

        const fullName = `${patient.firstName} ${patient.lastName}`.toLowerCase();
        const nationalId = patient.nationalId?.toLowerCase() || '';
        const mrn = patient.mrn?.toLowerCase() || '';

        return fullName.includes(query) ||
          nationalId.includes(query) ||
          mrn.includes(query);
      });
    }

    // Apply filters
    if (filters.strokeType) {
      filtered = filtered.filter(case_ => case_.strokeType === filters.strokeType);
    }
    if (filters.status) {
      filtered = filtered.filter(case_ => case_.currentStatus === filters.status);
    }
    if (filters.originHospitalId) {
      filtered = filtered.filter(case_ => case_.originHospitalId === filters.originHospitalId);
    }
    if (filters.destinationHospitalId) {
      filtered = filtered.filter(case_ => case_.destinationHospitalId === filters.destinationHospitalId);
    }
    if (filters.modeOfArrival) {
      filtered = filtered.filter(case_ => case_.modeOfArrival === filters.modeOfArrival);
    }
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter(case_ => {
        // Use timeOfTriage for "From Date" filter
        const triageTime = case_.timeOfTriage ? new Date(case_.timeOfTriage) : null;
        if (!triageTime) return false;
        triageTime.setHours(0, 0, 0, 0);
        return triageTime >= fromDate;
      });
    }
    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(case_ => {
        // Use timeOfTriage for "To Date" filter
        const triageTime = case_.timeOfTriage ? new Date(case_.timeOfTriage) : null;
        if (!triageTime) return false;
        return triageTime <= toDate;
      });
    }

    setFilteredCases(filtered);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const handleApplyFilters = () => {
    applyFiltersAndSearch();
  };

  const handleClearFilters = () => {
    setFilters({
      strokeType: '',
      status: '',
      originHospitalId: '',
      destinationHospitalId: '',
      modeOfArrival: '',
      dateFrom: '',
      dateTo: '',
    });
    setSearchQuery('');
    applyFiltersAndSearch();
  };

  const handleFiltersChange = (newFilters: any) => {
    setFilters(newFilters);
  };

  const handleAddCaseNote = (strokeCase: StrokeCase) => {
    setSelectedCaseForNote(strokeCase);
    setShowCaseNoteModal(true);
  };

  const handleCaseNoteSubmit = async (data: any) => {
    try {
      await notificationService.createCaseNote(data);
      setShowCaseNoteModal(false);
      setSelectedCaseForNote(null);
      // You could add a success notification here
    } catch (error) {
      console.error('Error creating case note:', error);
      // You could add an error notification here
    }
  };

  const handleCaseNoteClose = () => {
    setShowCaseNoteModal(false);
    setSelectedCaseForNote(null);
  };
  const transformStrokeCase = (strokeCase: StrokeCase): UnifiedCaseCardProps => {
    const patient: PatientInfo = {
      name: `${strokeCase.patient?.firstName || ''} ${strokeCase.patient?.lastName || ''}`.trim(),
      age: strokeCase.patient?.age || 0,
      gender: (strokeCase.patient?.gender as 'MALE' | 'FEMALE') || 'MALE',
      id: strokeCase.id,
      nationalId: strokeCase.patient?.nationalId,
      mrn: strokeCase.patient?.mrn,
      admissionDate: strokeCase.createdAt,
      originHospital: strokeCase.originHospital?.name || 'N/A',
      destinationHospital: strokeCase.destinationHospital?.name || 'N/A',
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
        met: strokeCase.currentStatus !== 'SUSPECTED' && strokeCase.currentStatus !== 'IMAGING_PENDING',
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
        value: strokeCase.doorToCtScanMinutes || 'N/A',
        target: '≤25min',
        unit: 'min',
        met: !strokeCase.doorToCtScanMinutes || strokeCase.doorToCtScanMinutes <= 20,
        percentage: strokeCase.doorToCtScanMinutes ? (strokeCase.doorToCtScanMinutes / 25) * 100 : undefined,
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

    // Data completeness - use the same comprehensive calculation as table view
    const dataCompleteness = calculateComprehensiveDataCompleteness(strokeCase);

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
        label: 'Outcome Form',
        icon: <OutcomeFormIcon />,
        onClick: () => onOpenOutcomeForm(strokeCase),
        color: 'primary',
        variant: 'outlined',
      },
      {
        label: 'Add Case Note',
        icon: <CommentIcon />,
        onClick: () => handleAddCaseNote(strokeCase),
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
        onClick: () => onDeleteCase?.(strokeCase.id),
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

    // Expandable content with chronological timestampss
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
              <DataRow label="Symptom Onset" value={formatTimestamp(strokeCase.timeOfSymptomOnset)} />
              <DataRow label="Triage" value={formatTimestamp(strokeCase.timeOfTriage)} />
              <DataRow label="Physician Assessment" value={formatTimestamp(strokeCase.timeOfPhysicianAssessment)} />
              <DataRow label="CT Scan Start" value={formatTimestamp(strokeCase.timeOfCtScanStart)} />
              <DataRow label="CT Report Final" value={formatTimestamp(strokeCase.timeOfCtReportFinal)} />
              <DataRow label="Thrombolysis Order" value={formatTimestamp(strokeCase.thrombolysisOrderTime)} />
              <DataRow label="IV Thrombolysis" value={formatTimestamp(strokeCase.ivThrombolysisAdministrationTime)} />
              <DataRow label="Thrombectomy Puncture" value={formatTimestamp(strokeCase.timeOfMechanicalThrombectomyPuncture)} />
              <DataRow label="Thrombectomy Complete" value={formatTimestamp(strokeCase.timeOfThrombectomyComplete)} />
            </Box>
          </Grid>

          {/* Treatment Information - Right Column */}
          <Grid item xs={12} md={6}>
            <Box sx={{ bgcolor: '#f8fafc', borderRadius: 1, p: 1.5, border: '1px solid #e2e8f0' }}>
              <Box display="flex" alignItems="center" gap={0.75} mb={1}>
                <MedicalServicesIcon sx={{ color: '#ef4444', fontSize: 16 }} />
                <Typography sx={{ fontWeight: 700, color: '#1e293b', fontSize: '0.75rem' }}>
                  Treatment Information
                </Typography>
              </Box>
              <DataRow label="Thrombolysis Eligible" value={strokeCase.eligibleForThrombolysis ? 'Yes' : 'No'} />
              <DataRow label="Thrombectomy Eligible" value={strokeCase.eligibleForThrombectomy ? 'Yes' : 'No'} />
              <DataRow label="Thrombolysis Contraindication" value={strokeCase.thrombolysisContraindications ? 'Yes' : 'No'} />
              <DataRow label="Selected Treatment" value={strokeCase.selectedTreatment || 'N/A'} />
              <DataRow label="mRS Score" value={strokeCase.modifiedRankinScaleAt90Days || 'N/A'} />
              <DataRow label="Discharge Date" value={strokeCase.dischargeDate || 'N/A'} />
            </Box>
          </Grid>
        </Grid>
      </Box>
    );

    return {
      patient,
      caseId: strokeCase.id,
      caseType: 'stroke' as const,
      status: strokeCase.currentStatus,
      severity: strokeCase.strokeSeverity,
      pathway: strokeCase.ticket?.pathway,
      targetsMet,
      performanceIndicators,
      timeMetrics,
      dataCompleteness,
      dataCompletenessTooltip: getDataCompletenessTooltipText(strokeCase),
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
    if (strokeCase.doorToCtScanMinutes && strokeCase.doorToCtScanMinutes <= 20) {
      met++;
    }

    // Door to CT Report (≤30min)
    total++;
    if (strokeCase.doorToCtReportMinutes && strokeCase.doorToCtReportMinutes <= 30) {
      met++;
    }

    return `${met}/${total}`;
  };

  const calculateComprehensiveDataCompleteness = (strokeCase: StrokeCase) => {
    // Calculate outcome form completeness (50% weight)
    const outcomeCompleteness = strokeCase.outcomePercentageCompleteness || 0;
    const outcomeWeight = 0.5;

    // Calculate case data completeness (50% weight)
    const caseDataCompleteness = calculateCaseDataCompleteness(strokeCase);
    const caseDataWeight = 0.5;

    // Calculate combined completeness
    const combinedCompleteness = Math.round(
      (outcomeCompleteness * outcomeWeight) + (caseDataCompleteness * caseDataWeight)
    );

    // Calculate total fields for display
    const totalFields = calculateTotalFields(strokeCase);
    const completedFields = Math.round((combinedCompleteness / 100) * totalFields);

    return {
      percentage: combinedCompleteness,
      completed: completedFields,
      total: totalFields,
    };
  };

  const calculateCaseDataCompleteness = (strokeCase: StrokeCase): number => {
    // Core required fields for stroke cases
    const requiredFields = [
      'modeOfArrival',
      'timeOfTriage',
      'timeOfPhysicianAssessment',
      'strokeTypeDetailed',
      'ctScanPerformed',
      'candidateForIVThrombolysis',
      'candidateForMechanicalThrombectomy',
      'disposition',
    ];

    let completedFields = 0;
    let totalFields = requiredFields.length;

    // Check basic required fields
    requiredFields.forEach(field => {
      const value = strokeCase[field as keyof StrokeCase];
      if (value !== null && value !== undefined && value !== '') {
        completedFields++;
      }
    });

    // If CT scan was performed, check CT-related fields
    if (strokeCase.ctScanPerformed === true) {
      const ctFields = ['timeOfCtScanStart', 'timeOfCtReportFinal', 'ctFindings'];
      let ctCompleted = 0;

      ctFields.forEach(field => {
        const value = strokeCase[field as keyof StrokeCase];
        if (value !== null && value !== undefined && value !== '') {
          ctCompleted++;
        }
      });

      totalFields += ctFields.length;
      completedFields += ctCompleted;
    }

    // If candidate for IV thrombolysis, check thrombolysis fields
    if (strokeCase.candidateForIVThrombolysis === 'YES') {
      const thrombolysisFields = ['thrombolysisOrderTime', 'ivThrombolysisAdministrationTime', 'ivThrombolysisGiven'];
      let thrombolysisCompleted = 0;

      thrombolysisFields.forEach(field => {
        const value = strokeCase[field as keyof StrokeCase];
        if (value !== null && value !== undefined && value !== '') {
          thrombolysisCompleted++;
        }
      });

      totalFields += thrombolysisFields.length;
      completedFields += thrombolysisCompleted;
    }

    // If candidate for mechanical thrombectomy, check thrombectomy fields
    if (strokeCase.candidateForMechanicalThrombectomy === 'YES') {
      const thrombectomyFields = ['timeOfMechanicalThrombectomyPuncture', 'mechanicalThrombectomyPerformed', 'timeOfThrombectomyComplete'];
      let thrombectomyCompleted = 0;

      thrombectomyFields.forEach(field => {
        const value = strokeCase[field as keyof StrokeCase];
        if (value !== null && value !== undefined && value !== '') {
          thrombectomyCompleted++;
        }
      });

      totalFields += thrombectomyFields.length;
      completedFields += thrombectomyCompleted;
    }

    // If transfer to another hospital, check transfer fields
    if (strokeCase.transferToAnotherHospital === true) {
      const transferFields = ['timeOfTransferActivation', 'timeOfTransferDeparture', 'prehospitalNotificationBySrca'];
      let transferCompleted = 0;

      transferFields.forEach(field => {
        const value = strokeCase[field as keyof StrokeCase];
        if (value !== null && value !== undefined && value !== '') {
          transferCompleted++;
        }
      });

      totalFields += transferFields.length;
      completedFields += transferCompleted;
    }

    return totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0;
  };

  const calculateTotalFields = (strokeCase: StrokeCase): number => {
    // Calculate total fields for display purposes
    let totalFields = 8; // Base required fields

    // Add conditional fields
    if (strokeCase.ctScanPerformed === true) {
      totalFields += 3; // CT fields
    }
    if (strokeCase.candidateForIVThrombolysis === 'YES') {
      totalFields += 3; // Thrombolysis fields
    }
    if (strokeCase.candidateForMechanicalThrombectomy === 'YES') {
      totalFields += 3; // Thrombectomy fields
    }
    if (strokeCase.transferToAnotherHospital === true) {
      totalFields += 3; // Transfer fields
    }

    // Add outcome form fields (9 fields)
    totalFields += 9;

    return totalFields;
  };

  const getDataCompletenessTooltipText = (strokeCase: StrokeCase): string => {
    const outcomeCompleteness = strokeCase.outcomePercentageCompleteness || 0;
    const caseDataCompleteness = calculateCaseDataCompleteness(strokeCase);
    const combinedCompleteness = Math.round(
      (outcomeCompleteness * 0.5) + (caseDataCompleteness * 0.5)
    );

    const outcomeText = `Outcome Form: ${outcomeCompleteness}%`;
    const caseDataText = `Case Data: ${caseDataCompleteness}%`;
    const combinedText = `Combined: ${combinedCompleteness}%`;

    return `${outcomeText}\n${caseDataText}\n${combinedText}`;
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
        return 'info';
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
          startIcon={<AddIcon />}
          onClick={onCreateCase}
        >
          Create Stroke Case
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header and Actions */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Stroke Cases
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {filteredCases.length} of {totalCount || cases.length} cases
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<FilterIcon />}
            onClick={() => setFilterDialogOpen(true)}
          >
            Filters
          </Button>
          {onViewModeChange && (
            <ToggleButtonGroup
              value="cards"
              exclusive
              onChange={(_, newMode) => newMode && onViewModeChange(newMode)}
              size="small"
            >
              <ToggleButton value="table">
                <TableIcon />
              </ToggleButton>
              <ToggleButton value="cards">
                <CardsIcon />
              </ToggleButton>
            </ToggleButtonGroup>
          )}
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onCreateCase}
          >
            Create Case
          </Button>
        </Box>
      </Box>

      {/* Search Bar */}
      <Box sx={{ mb: 1.5 }}>
        <TextField
          fullWidth
          placeholder="Search stroke cases..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: searchQuery && (
              <InputAdornment position="end">
                <IconButton
                  aria-label="clear search"
                  onClick={handleClearSearch}
                  edge="end"
                  size="small"
                >
                  <ClearIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
          size="small"
        />
      </Box>

      <Grid container spacing={2}>
        {filteredCases.map((strokeCase) => {
          const transformedCase = transformStrokeCase(strokeCase);
          return (
            <Grid item xs={12} md={6} lg={6} key={transformedCase.caseId}>
              <UnifiedCaseCard {...transformedCase} />
            </Grid>
          );
        })}
      </Grid>

      {/* No pagination in cards view to mirror trauma portal design */}

      {/* Filter Dialog */}
      <StrokeCasesFilters
        open={filterDialogOpen}
        onClose={() => setFilterDialogOpen(false)}
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onApplyFilters={handleApplyFilters}
        onClearFilters={handleClearFilters}
      />

      {/* Case Note Modal */}
      {selectedCaseForNote && (
        <CaseNoteModal
          open={showCaseNoteModal}
          onClose={handleCaseNoteClose}
          onSubmit={handleCaseNoteSubmit}
          patientName={`${selectedCaseForNote.patient?.firstName || ''} ${selectedCaseForNote.patient?.lastName || ''}`.trim()}
          caseType="STROKE"
          caseId={selectedCaseForNote.id}
          patientId={selectedCaseForNote.patientId}
          ticketId={selectedCaseForNote.ticketId}
        />
      )}
    </Box>
  );
};

export default StrokeCasesCards;