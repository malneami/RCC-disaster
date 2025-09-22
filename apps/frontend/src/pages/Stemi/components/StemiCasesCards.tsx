import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
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
} from '@mui/icons-material';
import { StemiCase } from '../services/stemiService';
import GenericFilterDialog from '../../../components/Common/GenericFilterDialog';
import UnifiedCaseCard, { 
  UnifiedCaseCardProps, 
  PatientInfo, 
  TimeMetric, 
  PerformanceIndicator, 
  CaseAction 
} from '../../../components/Common/UnifiedCaseCard';

interface StemiCasesCardsProps {
  cases: StemiCase[];
  loading: boolean;
  onEditCase: (case_: StemiCase) => void;
  onViewCase: (case_: StemiCase) => void;
  onDeleteCase: (id: string) => void;
  onCreateCase: () => void;
  onOutcomeFormUpdate?: (caseId: string, updatedData: any) => void;
  onViewModeChange?: (mode: 'table' | 'cards') => void;
}

const StemiCasesCards: React.FC<StemiCasesCardsProps> = ({
  cases,
  loading,
  onEditCase,
  onViewCase,
  onDeleteCase,
  onCreateCase,
  onViewModeChange,
}) => {
  const [filteredCases, setFilteredCases] = useState<StemiCase[]>(cases);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    search: '',
    modeOfArrival: '',
    currentStatus: '',
    selectedTreatment: '',
    ecgResult: '',
    rccActivated: null as boolean | null,
    originHospitalId: '',
    destinationHospitalId: '',
    startDate: '',
    endDate: '',
  });
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);

  useEffect(() => {
    applyFiltersAndSearch();
  }, [cases, filters]);

  const applyFiltersAndSearch = () => {
    let filtered = cases.filter((case_) => {
      // Search filter (use filters.search instead of searchQuery)
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = 
          case_.patient?.firstName?.toLowerCase().includes(searchLower) ||
          case_.patient?.lastName?.toLowerCase().includes(searchLower) ||
          case_.patient?.nationalId?.toLowerCase().includes(searchLower) ||
          case_.presentingSymptoms?.toLowerCase().includes(searchLower) ||
          case_.originHospital?.name?.toLowerCase().includes(searchLower);
        
        if (!matchesSearch) return false;
      }

      // Other filters (matching table view logic)
      if (filters.modeOfArrival && case_.modeOfArrival !== filters.modeOfArrival) return false;
      if (filters.currentStatus && case_.currentStatus !== filters.currentStatus) return false;
      if (filters.selectedTreatment && case_.selectedTreatment !== filters.selectedTreatment) return false;
      if (filters.ecgResult && case_.ecgResult !== filters.ecgResult) return false;
      if (filters.rccActivated !== null && case_.rccActivated !== filters.rccActivated) return false;
      if (filters.originHospitalId && case_.originHospitalId !== filters.originHospitalId) return false;
      if (filters.destinationHospitalId && case_.destinationHospitalId !== filters.destinationHospitalId) return false;

      // Date filters
      if (filters.startDate) {
        const caseDate = new Date(case_.ticket.createdAt);
        const fromDate = new Date(filters.startDate);
        if (caseDate < fromDate) return false;
      }
      if (filters.endDate) {
        const caseDate = new Date(case_.ticket.createdAt);
        const toDate = new Date(filters.endDate);
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
      currentStatus: '',
      selectedTreatment: '',
      ecgResult: '',
      rccActivated: null,
      originHospitalId: '',
      destinationHospitalId: '',
      startDate: '',
      endDate: '',
    });
    setSearchQuery('');
    applyFiltersAndSearch();
  };

  const handleFiltersChange = (newFilters: any) => {
    setFilters(newFilters);
  };
  const transformStemiCase = (stemiCase: StemiCase): UnifiedCaseCardProps => {
    const patient: PatientInfo = {
      name: `${stemiCase.patient?.firstName || ''} ${stemiCase.patient?.lastName || ''}`.trim(),
      age: stemiCase.patient?.age || 0,
      gender: stemiCase.patient?.gender || 'MALE',
      id: stemiCase.id,
      nationalId: stemiCase.patient?.nationalId,
      mrn: stemiCase.patient?.nationalId,
      admissionDate: stemiCase.createdAt,
      modeOfArrival: stemiCase.modeOfArrival,
    };

    // Calculate targets met
    const targetsMet = calculateTargetsMet(stemiCase);
    const overallScore = calculateOverallScore(stemiCase);
    
    // Performance indicators
    const performanceIndicators: PerformanceIndicator[] = [
      {
        label: stemiCase.currentStatus.replace(/_/g, ' '),
        met: stemiCase.currentStatus !== 'SUSPECTED',
        color: getStatusColor(stemiCase.currentStatus),
      },
      {
        label: stemiCase.ecgResult || 'Pending',
        met: stemiCase.ecgResult !== 'PENDING',
        color: getEcgResultColor(stemiCase.ecgResult),
      },
    ];

    // Time metrics
    const timeMetrics: TimeMetric[] = [
      {
        label: 'Door to ECG',
        value: stemiCase.doorToEcgMinutes || 'N/A',
        target: '≤10min',
        unit: 'min',
        met: !stemiCase.doorToEcgMinutes || stemiCase.doorToEcgMinutes <= 10,
        percentage: stemiCase.doorToEcgMinutes ? (stemiCase.doorToEcgMinutes / 10) * 100 : undefined,
      },
      {
        label: 'Door In-Door Out',
        value: stemiCase.doorInDoorOutMinutes || 'N/A',
        target: '≤30min',
        unit: 'min',
        met: !stemiCase.doorInDoorOutMinutes || stemiCase.doorInDoorOutMinutes <= 30,
        percentage: stemiCase.doorInDoorOutMinutes ? (stemiCase.doorInDoorOutMinutes / 30) * 100 : undefined,
      },
      {
        label: 'Door to Balloon',
        value: stemiCase.doorToBalloonMinutes || 'N/A',
        target: '≤90min',
        unit: 'min',
        met: !stemiCase.doorToBalloonMinutes || stemiCase.doorToBalloonMinutes <= 90,
        percentage: stemiCase.doorToBalloonMinutes ? (stemiCase.doorToBalloonMinutes / 90) * 100 : undefined,
      },
    ];

    // Data completeness - use backend percentage if available
    const dataCompleteness = stemiCase.outcomePercentageCompleteness !== undefined 
      ? {
          percentage: stemiCase.outcomePercentageCompleteness,
          completed: Math.round((stemiCase.outcomePercentageCompleteness / 100) * 20), // Assuming 20 total fields
          total: 20,
        }
      : calculateDataCompleteness(stemiCase);

    // Case details
    const caseDetails = {
      'ID/Iqamah': stemiCase.patient?.nationalId || 'N/A',
      'Mode of Arrival': stemiCase.modeOfArrival || 'N/A',
    };

    // Actions
    const actions: CaseAction[] = [
      {
        label: 'View Details',
        icon: <ViewIcon />,
        onClick: () => onViewCase(stemiCase),
        color: 'primary',
        variant: 'outlined',
      },
      {
        label: 'Edit Case',
        icon: <EditIcon />,
        onClick: () => onEditCase(stemiCase),
        color: 'secondary',
        variant: 'outlined',
      },
      {
        label: 'Delete Case',
        icon: <DeleteIcon />,
        onClick: () => onDeleteCase(stemiCase.id),
        color: 'error',
        variant: 'outlined',
      },
    ];

    // Expandable content
    const expandableContent = (
      <Box>
        <Typography variant="subtitle2" gutterBottom>
          Critical Timestamps
        </Typography>
        <Grid container spacing={2} mb={2}>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Triage Time: {stemiCase.triageTime || 'N/A'}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              First ECG Time: {stemiCase.firstEcgTime || 'N/A'}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Door to ECG Time: {stemiCase.doorToEcgMinutes || 'N/A'} min
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Door Out Time: {stemiCase.doorOutTime || 'N/A'}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Cath Lab Prep Time: {stemiCase.cathLabActivationTime || 'N/A'}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              PCI Procedure Start: {stemiCase.pciProcedureStartTime || 'N/A'}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Device Activation Time: {stemiCase.cathLabActivationTime || 'N/A'}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Legacy Balloon Time: {stemiCase.balloonInflationTime || 'N/A'}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Cath Lab Activation: {stemiCase.cathLabActivationTime || 'N/A'}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Cath Lab Arrival: {stemiCase.cathLabArrivalTime || 'N/A'}
            </Typography>
          </Grid>
        </Grid>
        
        <Divider sx={{ my: 2 }} />
        
        <Typography variant="subtitle2" gutterBottom>
          Treatment Information
        </Typography>
        <Grid container spacing={2} mb={2}>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Thrombolytic Given: {stemiCase.thrombolyticGiven ? 'Yes' : 'No'}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              PCI Eligible: {stemiCase.eligibleForPrimaryPci ? 'Yes' : 'No'}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              PCI Location: {stemiCase.pciLocation || 'N/A'}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Primary PCI Success: {stemiCase.successful ? 'Yes' : 'No'}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Thrombolysis Success: {stemiCase.thrombolyticGiven ? 'Yes' : 'No'}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Outcome: {stemiCase.currentStatus.replace(/_/g, ' ')}
            </Typography>
          </Grid>
        </Grid>
        
      </Box>
    );

    return {
      patient,
      caseId: stemiCase.id,
      caseType: 'stemi' as const,
      status: stemiCase.currentStatus,
      targetsMet,
      overallScore,
      performanceIndicators,
      timeMetrics,
      dataCompleteness,
      caseDetails,
      actions,
      expandableContent,
    };
  };

  const calculateTargetsMet = (stemiCase: StemiCase): string => {
    let met = 0;
    let total = 0;

    // Door to ECG (≤10min)
    total++;
    if (stemiCase.doorToEcgMinutes && stemiCase.doorToEcgMinutes <= 10) {
      met++;
    }

    // Door In-Door Out (≤30min)
    total++;
    if (stemiCase.doorInDoorOutMinutes && stemiCase.doorInDoorOutMinutes <= 30) {
      met++;
    }

    // Door to Balloon (≤90min)
    total++;
    if (stemiCase.doorToBalloonMinutes && stemiCase.doorToBalloonMinutes <= 90) {
      met++;
    }

    return `${met}/${total}`;
  };

  const calculateOverallScore = (stemiCase: StemiCase): string => {
    const targetsMet = calculateTargetsMet(stemiCase);
    const met = parseInt(targetsMet.split('/')[0]);
    const total = parseInt(targetsMet.split('/')[1]);
    return `${Math.round((met / total) * 100)}%`;
  };

  const calculateDataCompleteness = (stemiCase: StemiCase) => {
    const fields = [
      'currentStatus',
      'modeOfArrival',
      'ecgResult',
      'selectedTreatment',
      'doorToEcgMinutes',
      'doorInDoorOutMinutes',
      'doorToBalloonMinutes',
      'triageTime',
      'firstEcgTime',
      'doorOutTime',
      'cathLabActivationTime',
      'cathLabArrivalTime',
      'pciProcedureStartTime',
      'balloonInflationTime',
      'thrombolyticGiven',
      'eligibleForPrimaryPci',
    ];

    const completed = fields.filter(field => {
      const value = (stemiCase as any)[field];
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
      case 'BALLOON_INFLATED':
      case 'CCU_ADMITTED':
      case 'DISCHARGED':
        return 'success';
      case 'RCC_ACTIVATED':
      case 'IN_TRANSIT':
      case 'PCI_READY':
        return 'info';
      case 'SUSPECTED':
      case 'ECG_PENDING':
        return 'warning';
      case 'EXPIRED':
        return 'error';
      default:
        return 'info';
    }
  };

  const getEcgResultColor = (result: string | undefined): 'success' | 'warning' | 'error' | 'info' => {
    if (!result) return 'info';
    switch (result) {
      case 'NORMAL':
        return 'success';
      case 'STEMI_ANTERIOR':
      case 'STEMI_INFERIOR':
      case 'STEMI_LATERAL':
      case 'STEMI_POSTERIOR':
        return 'error';
      case 'NSTEMI_CHANGES':
      case 'UNSTABLE_PATTERN':
        return 'warning';
      case 'PENDING':
        return 'info';
      default:
        return 'info';
    }
  };

  // Filter fields configuration (matching table view)
  const filterFields = [
    {
      key: 'search',
      label: 'Search',
      type: 'text' as const,
      placeholder: 'Search by patient name, ID, or symptoms...',
    },
    {
      key: 'modeOfArrival',
      label: 'Mode of Arrival',
      type: 'select' as const,
      options: [
        { value: 'AMBULANCE', label: 'Ambulance' },
        { value: 'PRIVATE_VEHICLE', label: 'Private Vehicle' },
        { value: 'AIR_TRANSPORT', label: 'Air Transport' },
        { value: 'WALK_IN', label: 'Walk-in' },
        { value: 'POLICE', label: 'Police' },
        { value: 'TRANSFERRED_FROM_HOSPITAL', label: 'Hospital Transfer' },
        { value: 'OTHER', label: 'Other' },
      ],
    },
    {
      key: 'currentStatus',
      label: 'Current Status',
      type: 'select' as const,
      options: [
        { value: 'SUSPECTED', label: 'Suspected' },
        { value: 'ECG_PENDING', label: 'ECG Pending' },
        { value: 'STEMI_CONFIRMED', label: 'STEMI Confirmed' },
        { value: 'NSTEMI_CONFIRMED', label: 'NSTEMI Confirmed' },
        { value: 'UNSTABLE_ANGINA', label: 'Unstable Angina' },
        { value: 'RCC_ACTIVATED', label: 'RCC Activated' },
        { value: 'IN_TRANSIT', label: 'In Transit' },
        { value: 'PCI_READY', label: 'PCI Ready' },
        { value: 'BALLOON_INFLATED', label: 'Balloon Inflated' },
        { value: 'CCU_ADMITTED', label: 'CCU Admitted' },
        { value: 'DISCHARGED', label: 'Discharged' },
        { value: 'EXPIRED', label: 'Expired' },
      ],
    },
    {
      key: 'selectedTreatment',
      label: 'Selected Treatment',
      type: 'select' as const,
      options: [
        { value: 'PRIMARY_PCI', label: 'Primary PCI' },
        { value: 'RESCUE_PCI', label: 'Rescue PCI' },
        { value: 'FIBRINOLYSIS', label: 'Fibrinolysis' },
        { value: 'TRANSFER_FOR_PRIMARY_PCI', label: 'Transfer for Primary PCI' },
        { value: 'MEDICAL_MANAGEMENT', label: 'Medical Management' },
      ],
    },
    {
      key: 'ecgResult',
      label: 'ECG Result',
      type: 'select' as const,
      options: [
        { value: 'PENDING', label: 'Pending' },
        { value: 'NORMAL', label: 'Normal' },
        { value: 'STEMI_ANTERIOR', label: 'STEMI Anterior' },
        { value: 'STEMI_INFERIOR', label: 'STEMI Inferior' },
        { value: 'STEMI_LATERAL', label: 'STEMI Lateral' },
        { value: 'STEMI_POSTERIOR', label: 'STEMI Posterior' },
        { value: 'NSTEMI_CHANGES', label: 'NSTEMI Changes' },
        { value: 'UNSTABLE_PATTERN', label: 'Unstable Pattern' },
        { value: 'TECHNICAL_ISSUE', label: 'Technical Issue' },
      ],
    },
    {
      key: 'rccActivated',
      label: 'RCC Activated',
      type: 'select' as const,
      options: [
        { value: 'true', label: 'Yes' },
        { value: 'false', label: 'No' },
      ],
    },
    {
      key: 'originHospitalId',
      label: 'Origin Hospital',
      type: 'select' as const,
      options: [], // Will be populated dynamically
    },
    {
      key: 'destinationHospitalId',
      label: 'Destination Hospital',
      type: 'select' as const,
      options: [], // Will be populated dynamically
    },
    {
      key: 'startDate',
      label: 'From Date',
      type: 'date' as const,
    },
    {
      key: 'endDate',
      label: 'To Date',
      type: 'date' as const,
    },
  ];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={4}>
        <Typography>Loading STEMI cases...</Typography>
      </Box>
    );
  }

  if (cases.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No STEMI cases found
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Create your first STEMI case to get started
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onCreateCase}
        >
          Create STEMI Case
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header and Actions */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">
          STEMI Cases ({filteredCases.length})
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
        {filteredCases.map((stemiCase) => {
          const transformedCase = transformStemiCase(stemiCase);
          return (
            <Grid item xs={12} md={6} lg={4} key={transformedCase.caseId}>
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
    </Box>
  );
};

export default StemiCasesCards;