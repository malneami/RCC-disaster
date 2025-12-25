import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
  Grid,
  Divider,
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
  AccessTime as AccessTimeIcon,
  MedicalServices as MedicalServicesIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { TraumaCase, TraumaService } from '../../../services/traumaService';
import GenericFilterDialog from '../../../components/Common/GenericFilterDialog';
import { MODE_OF_ARRIVAL_OPTIONS, MECHANISM_OF_INJURY_OPTIONS, DISPOSITION_OPTIONS } from '../constants/traumaConstants';
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
  onCreateCase: () => void;
  onDeleteCase: (id: string) => Promise<void>;
  onUpdateCase: (id: string, data: any) => Promise<void>;
  onViewDetails: (case_: TraumaCase) => void;
  onEditCase: (case_: TraumaCase) => void;
  isAdmin: boolean;
  onViewModeChange?: (mode: 'table' | 'cards') => void;
  onFiltersChange?: (filters: any) => void;
}

const TraumaCasesCards: React.FC<TraumaCasesCardsProps> = ({
  cases,
  onCreateCase,
  onDeleteCase,
  onViewDetails,
  onEditCase,
  onViewModeChange,
  onFiltersChange,
}) => {
  const [filteredCases, setFilteredCases] = useState<TraumaCase[]>(cases);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<{
    search: string;
    modeOfArrival: string;
    mechanismOfInjury: string;
    edDisposition: string;
    criticalCase: boolean | string | null;
    transferCase: boolean | string | null;
    dateFrom: string;
    dateTo: string;
    hospitalId: string;
  }>({
    search: '',
    modeOfArrival: '',
    mechanismOfInjury: '',
    edDisposition: '',
    criticalCase: null,
    transferCase: null,
    dateFrom: '',
    dateTo: '',
    hospitalId: '',
  });
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [showCaseNoteModal, setShowCaseNoteModal] = useState(false);
  const [selectedCaseForNote, setSelectedCaseForNote] = useState<TraumaCase | null>(null);

  useEffect(() => {
    applyFiltersAndSearch();
  }, [cases, filters]);

  useEffect(() => {
    if (onFiltersChange) {
      onFiltersChange(filters);
    }
  }, [filters, onFiltersChange]);

  const applyFiltersAndSearch = () => {
    let filtered = cases.filter((case_) => {
      // Search filter (use filters.search instead of searchQuery)
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch =
          case_.patient?.firstName?.toLowerCase().includes(searchLower) ||
          case_.patient?.lastName?.toLowerCase().includes(searchLower) ||
          case_.patient?.nationalId?.toLowerCase().includes(searchLower) ||
          case_.chiefComplaint?.toLowerCase().includes(searchLower) ||
          case_.originHospital?.name?.toLowerCase().includes(searchLower);

        if (!matchesSearch) return false;
      }

      // Other filters (matching table view logic)
      if (filters.modeOfArrival && case_.modeOfArrival !== filters.modeOfArrival) return false;
      if (filters.mechanismOfInjury && case_.mechanismOfInjury !== filters.mechanismOfInjury) return false;
      if (filters.edDisposition && case_.edDisposition !== filters.edDisposition) return false;

      // Boolean filters - convert string to boolean if needed
      if (filters.criticalCase !== null && filters.criticalCase !== '') {
        let criticalCaseValue: boolean;
        if (typeof filters.criticalCase === 'string') {
          criticalCaseValue = filters.criticalCase === 'true';
        } else {
          criticalCaseValue = filters.criticalCase as boolean;
        }
        if (case_.criticalCase !== criticalCaseValue) return false;
      }
      if (filters.transferCase !== null && filters.transferCase !== '') {
        let transferCaseValue: boolean;
        if (typeof filters.transferCase === 'string') {
          transferCaseValue = filters.transferCase === 'true';
        } else {
          transferCaseValue = filters.transferCase as boolean;
        }
        if (case_.transferCase !== transferCaseValue) return false;
      }

      if (filters.hospitalId && case_.originHospitalId !== filters.hospitalId) return false;

      // Date filters
      if (filters.dateFrom) {
        const caseDate = new Date(case_.arrivalDateTime);
        const fromDate = new Date(filters.dateFrom);
        if (caseDate < fromDate) return false;
      }
      if (filters.dateTo) {
        const caseDate = new Date(case_.arrivalDateTime);
        const toDate = new Date(filters.dateTo);
        toDate.setHours(23, 59, 59, 999); // End of day
        if (caseDate > toDate) return false;
      }

      return true;
    });

    setFilteredCases(filtered);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      modeOfArrival: '',
      mechanismOfInjury: '',
      edDisposition: '',
      criticalCase: null,
      transferCase: null,
      dateFrom: '',
      dateTo: '',
      hospitalId: '',
    });
    setSearchQuery('');
    applyFiltersAndSearch();
  };

  const handleFiltersChange = (newFilters: any) => {
    // Convert string boolean values to actual booleans for criticalCase and transferCase
    const processedFilters: any = { ...newFilters };
    if (processedFilters.criticalCase !== undefined) {
      if (typeof processedFilters.criticalCase === 'string') {
        if (processedFilters.criticalCase === 'true') {
          processedFilters.criticalCase = true;
        } else if (processedFilters.criticalCase === 'false') {
          processedFilters.criticalCase = false;
        } else {
          processedFilters.criticalCase = null; // Empty string or invalid value
        }
      }
    }
    if (processedFilters.transferCase !== undefined) {
      if (typeof processedFilters.transferCase === 'string') {
        if (processedFilters.transferCase === 'true') {
          processedFilters.transferCase = true;
        } else if (processedFilters.transferCase === 'false') {
          processedFilters.transferCase = false;
        } else {
          processedFilters.transferCase = null; // Empty string or invalid value
        }
      }
    }
    setFilters(processedFilters);
  };

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

  const getBodyRegionInjuries = (traumaCase: TraumaCase): string[] => {
    const injuries = [];

    if (traumaCase.headAndNeckInjury) {
      injuries.push(`Head/Neck: ${traumaCase.headAndNeckInjury}`);
    }
    if (traumaCase.chestInjury) {
      injuries.push(`Chest: ${traumaCase.chestInjury}`);
    }
    if (traumaCase.abdomenInjury) {
      injuries.push(`Abdomen: ${traumaCase.abdomenInjury}`);
    }
    if (traumaCase.extremitiesInjury) {
      injuries.push(`Extremities: ${traumaCase.extremitiesInjury}`);
    }
    if (traumaCase.externalInjury) {
      injuries.push(`External: ${traumaCase.externalInjury}`);
    }
    if (traumaCase.faceInjury) {
      injuries.push(`Face: ${traumaCase.faceInjury}`);
    }

    return injuries.length > 0 ? injuries : ['No specific injuries recorded'];
  };

  const getDaysAgo = (dateString: string): string => {
    const days = Math.floor((Date.now() - new Date(dateString).getTime()) / (1000 * 60 * 60 * 24));
    return `${days} days ago`;
  };

  // Filter fields configuration (matching table view)
  const filterFields = [
    {
      key: 'search',
      label: 'Search',
      type: 'text' as const,
      placeholder: 'Search by patient name, ID, or complaint...',
    },
    {
      key: 'modeOfArrival',
      label: 'Mode of Arrival',
      type: 'select' as const,
      options: [...MODE_OF_ARRIVAL_OPTIONS],
    },
    {
      key: 'mechanismOfInjury',
      label: 'Mechanism of Injury',
      type: 'select' as const,
      options: [...MECHANISM_OF_INJURY_OPTIONS],
    },
    {
      key: 'edDisposition',
      label: 'ED Disposition',
      type: 'select' as const,
      options: [...DISPOSITION_OPTIONS],
    },
    {
      key: 'criticalCase',
      label: 'Critical Case',
      type: 'select' as const,
      options: [
        { value: 'true', label: 'Yes' },
        { value: 'false', label: 'No' },
      ],
    },
    {
      key: 'transferCase',
      label: 'Transfer Case',
      type: 'select' as const,
      options: [
        { value: 'true', label: 'Yes' },
        { value: 'false', label: 'No' },
      ],
    },
    {
      key: 'dateFrom',
      label: 'From Date',
      type: 'date' as const,
    },
    {
      key: 'dateTo',
      label: 'To Date',
      type: 'date' as const,
    },
  ];

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
          startIcon={<AddIcon />}
          onClick={onCreateCase}
        >
          Create Trauma Case
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header and Actions */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">
          Trauma Cases ({filteredCases.length})
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<FilterIcon />}
            onClick={() => setFilterDialogOpen(true)}
          >
            Filter
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
            New Case
          </Button>
        </Box>
      </Box>

      {/* Search Bar */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search by patient name, MRN, or National ID..."
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
        {filteredCases.map((traumaCase) => {
          const transformedCase = transformTraumaCase(traumaCase);
          return (
            <Grid item xs={12} md={6} lg={6} key={transformedCase.caseId}>
              <UnifiedCaseCard {...transformedCase} />
            </Grid>
          );
        })}
      </Grid>

      {/* Filter Dialog */}
      <GenericFilterDialog
        open={filterDialogOpen}
        onClose={() => setFilterDialogOpen(false)}
        onApply={(newFilters) => {
          handleFiltersChange(newFilters);
          setFilterDialogOpen(false);
        }}
        onReset={handleClearFilters}
        fields={filterFields}
        values={filters}
      />

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