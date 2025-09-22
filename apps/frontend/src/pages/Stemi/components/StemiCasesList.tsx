import React, { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  IconButton,
  Chip,
  Typography,
  TextField,
  InputAdornment,
  Button,
  Tooltip,
  Alert,
  CircularProgress,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  Edit as EditIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Add as AddIcon,
  Assignment as OutcomeFormIcon,
  ViewModule as CardsIcon,
  TableChart as TableIcon,
  CheckCircle as CheckIcon,
  Cancel as CrossIcon,
} from '@mui/icons-material';
import { StemiCase, StemiFilterParams } from '../services/stemiService';
import LiveFilterDialog from './LiveFilterDialog';
import StemiOutcomeForm from './StemiOutcomeForm';
import StemiCaseCompleteness from './StemiCaseCompleteness';

interface StemiCasesListProps {
  cases: StemiCase[];
  totalCases: number;
  loading: boolean;
  page: number;
  rowsPerPage: number;
  onEditCase: (case_: StemiCase) => void;
  onViewCase: (case_: StemiCase) => void;
  onDeleteCase: (id: string) => void;
  onCreateCase: () => void;
  onOutcomeFormUpdate?: (caseId: string, updatedData: any) => void;
  onViewModeChange?: (mode: 'table' | 'cards') => void;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rowsPerPage: number) => void;
}

// Helper functions to calculate KPI status
const calculateKpiStatus = (case_: StemiCase) => {
  const kpis = {
    doorToEcg: false,
    doorToBalloon: false,
    doorToNeedle: false,
    rccActivation: false,
    doorInDoorOut: false,
  };

  // KPI 1: Door to ECG ≤10 min
  if (case_.doorToEcgMinutes !== null && case_.doorToEcgMinutes !== undefined) {
    kpis.doorToEcg = case_.doorToEcgMinutes <= 10;
  }

  // KPI 2: Door to Balloon - Direct ≤90min, Transfer ≤120min
  if (case_.doorToBalloonMinutes !== null && case_.doorToBalloonMinutes !== undefined) {
    const target = case_.caseType === 'TRANSFER' ? 120 : 90;
    kpis.doorToBalloon = case_.doorToBalloonMinutes <= target;
  }

  // KPI 3: Door to Needle ≤30min (Transfer cases only)
  if (case_.caseType === 'TRANSFER' && case_.doorToNeedleMinutes !== null && case_.doorToNeedleMinutes !== undefined) {
    kpis.doorToNeedle = case_.doorToNeedleMinutes <= 30;
  }

  // KPI 4: RCC Activation ≤15min (Transfer cases only)
  if (case_.caseType === 'TRANSFER' && case_.rccActivationToDoorOutMinutes !== null && case_.rccActivationToDoorOutMinutes !== undefined) {
    kpis.rccActivation = case_.rccActivationToDoorOutMinutes <= 15;
  }

  // KPI 5: Door In Door Out ≤30min (Transfer cases only)
  if (case_.caseType === 'TRANSFER' && case_.doorInDoorOutMinutes !== null && case_.doorInDoorOutMinutes !== undefined) {
    kpis.doorInDoorOut = case_.doorInDoorOutMinutes <= 30;
  }

  return kpis;
};

const KpiIcon: React.FC<{ met: boolean; applicable: boolean; minutes?: number | null }> = ({ met, applicable, minutes }) => {
  if (!applicable) {
    return <Typography variant="caption" color="textSecondary">-</Typography>;
  }
  
  return (
    <Box display="flex" alignItems="center" gap={0.5}>
      {met ? (
        <CheckIcon color="success" fontSize="small" />
      ) : (
        <CrossIcon color="error" fontSize="small" />
      )}
      <Typography variant="caption" color="textSecondary">
        {minutes !== null && minutes !== undefined ? `${minutes}m` : 'N/A'}
      </Typography>
    </Box>
  );
};

const StemiCasesList: React.FC<StemiCasesListProps> = ({
  cases,
  totalCases,
  loading,
  page,
  rowsPerPage,
  onEditCase,
  onViewCase,
  onDeleteCase,
  onCreateCase,
  onOutcomeFormUpdate,
  onViewModeChange,
  onPageChange,
  onRowsPerPageChange,
}) => {
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [hospitals, setHospitals] = useState<Array<{id: string, name: string}>>([]);
  
  // Local filters state (like trauma portal)
  const [filters, setFilters] = useState<StemiFilterParams>({
    search: '',
    modeOfArrival: '',
    currentStatus: '',
    selectedTreatment: '',
    ecgResult: '',
    rccActivated: undefined,
    originHospitalId: '',
    destinationHospitalId: '',
    startDate: '',
    endDate: '',
  });
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState<StemiCase | null>(null);
  const [outcomeFormDialogOpen, setOutcomeFormDialogOpen] = useState(false);
  const [outcomeFormCaseId, setOutcomeFormCaseId] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{
    field: keyof StemiCase | 'patient';
    direction: 'asc' | 'desc';
  }>({ field: 'createdAt', direction: 'desc' });

  // Load hospitals on component mount
  useEffect(() => {
    const loadHospitals = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/v1/hospitals');
        const hospitalsData = await response.json();
        setHospitals(hospitalsData);
      } catch (error) {
        console.error('Error loading hospitals:', error);
      }
    };
    loadHospitals();
  }, []);

  // Client-side filtering and sorting (like trauma portal)
  const filteredAndSortedCases = useMemo(() => {
    let filtered = cases.filter((case_) => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = 
          case_.patient?.firstName?.toLowerCase().includes(searchLower) ||
          case_.patient?.lastName?.toLowerCase().includes(searchLower) ||
          case_.patient?.nationalId?.toLowerCase().includes(searchLower) ||
          case_.presentingSymptoms?.toLowerCase().includes(searchLower) ||
          case_.originHospital?.name?.toLowerCase().includes(searchLower) ||
          case_.ticketId?.toLowerCase().includes(searchLower);
        
        if (!matchesSearch) return false;
      }

      // Other filters
      if (filters.currentStatus && case_.currentStatus !== filters.currentStatus) return false;
      if (filters.modeOfArrival && case_.modeOfArrival !== filters.modeOfArrival) return false;
      if (filters.selectedTreatment && case_.selectedTreatment !== filters.selectedTreatment) return false;
      if (filters.ecgResult && case_.ecgResult !== filters.ecgResult) return false;
      if (filters.rccActivated !== undefined && case_.rccActivated !== filters.rccActivated) return false;
      if (filters.originHospitalId && case_.originHospitalId !== filters.originHospitalId) return false;
      if (filters.destinationHospitalId && case_.destinationHospitalId !== filters.destinationHospitalId) return false;

      // Date filters
      if (filters.startDate) {
        const caseDate = new Date(case_.createdAt);
        const fromDate = new Date(filters.startDate);
        if (caseDate < fromDate) return false;
      }
      if (filters.endDate) {
        const caseDate = new Date(case_.createdAt);
        const toDate = new Date(filters.endDate);
        toDate.setHours(23, 59, 59, 999); // End of day
        if (caseDate > toDate) return false;
      }

      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      if (sortConfig.field === 'patient') {
        aValue = a.patient ? `${a.patient.firstName} ${a.patient.lastName}` : '';
        bValue = b.patient ? `${b.patient.firstName} ${b.patient.lastName}` : '';
      } else {
        aValue = a[sortConfig.field as keyof StemiCase];
        bValue = b[sortConfig.field as keyof StemiCase];
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [cases, filters, sortConfig]);

  // Use cases directly since pagination is now server-side
  const paginatedCases = filteredAndSortedCases;

  // Filter fields configuration (same design as trauma portal)
  const filterFields = useMemo(() => [
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
      options: hospitals.map(hospital => ({
        value: hospital.id,
        label: hospital.name
      })),
    },
    {
      key: 'destinationHospitalId',
      label: 'Destination Hospital',
      type: 'select' as const,
      options: hospitals.map(hospital => ({
        value: hospital.id,
        label: hospital.name
      })),
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
  ], [hospitals]);

  const handleChangePage = (_event: unknown, newPage: number) => {
    onPageChange(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    onRowsPerPageChange(newRowsPerPage);
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setFilters(prev => ({ ...prev, search: value }));
    onPageChange(0); // Reset to first page when searching
  };


  const handleClearFilters = () => {
    const clearedFilters = {
      search: '',
      modeOfArrival: '',
      currentStatus: '',
      selectedTreatment: '',
      ecgResult: '',
      rccActivated: undefined,
      originHospitalId: '',
      destinationHospitalId: '',
      startDate: '',
      endDate: '',
    };
    setFilters(clearedFilters);
    onPageChange(0);
  };

  const handleDeleteClick = (case_: StemiCase) => {
    setSelectedCase(case_);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedCase) return;
    
    try {
      setDeletingId(selectedCase.id);
      await onDeleteCase(selectedCase.id);
      setDeleteDialogOpen(false);
      setSelectedCase(null);
    } catch (error) {
      console.error('Error deleting case:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const handleOpenOutcomeForm = (case_: StemiCase) => {
    setSelectedCase(case_); // Set the selected case for the outcome form
    setOutcomeFormCaseId(case_.id);
    setOutcomeFormDialogOpen(true);
  };

  const handleOutcomeFormClose = () => {
    setOutcomeFormDialogOpen(false);
    setOutcomeFormCaseId(null);
  };

  const handleOutcomeFormSuccess = (updatedData?: any) => {
    // Call the parent callback to update the cases list
    if (outcomeFormCaseId && onOutcomeFormUpdate) {
      onOutcomeFormUpdate(outcomeFormCaseId, updatedData);
    }
  };

  const handleSort = (field: keyof StemiCase | 'patient') => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUSPECTED':
        return 'warning';
      case 'ECG_PENDING':
        return 'info';
      case 'STEMI_CONFIRMED':
        return 'error';
      case 'NSTEMI_CONFIRMED':
        return 'warning';
      case 'UNSTABLE_ANGINA':
        return 'warning';
      case 'RCC_ACTIVATED':
        return 'info';
      case 'IN_TRANSIT':
        return 'info';
      case 'PCI_READY':
        return 'success';
      case 'BALLOON_INFLATED':
        return 'success';
      case 'CCU_ADMITTED':
        return 'success';
      case 'DISCHARGED':
        return 'success';
      case 'EXPIRED':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPatientName = (patient: StemiCase['patient']) => {
    if (!patient) return 'Unknown Patient';
    return `${patient.firstName} ${patient.lastName}`;
  };

  const formatNationalId = (nationalId: string) => {
    // Format as XXX-XXXX-XXXX
    return nationalId.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
  };

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            STEMI Cases
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {filteredAndSortedCases.length} of {totalCases} cases
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<FilterIcon />}
            onClick={() => setFilterDialogOpen(true)}
          >
            Filters
          </Button>
          {onViewModeChange && (
            <ToggleButtonGroup
              value="table"
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
      <Box mb={3}>
        <TextField
          fullWidth
          placeholder="Search STEMI cases..."
          value={filters.search}
          onChange={handleSearch}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>


      {/* Cases Table */}
      <Card elevation={0}>
        <TableContainer component={Paper} elevation={0}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  <TableSortLabel
                    active={sortConfig.field === 'patient'}
                    direction={sortConfig.field === 'patient' ? sortConfig.direction : 'asc'}
                    onClick={() => handleSort('patient')}
                  >
                    Patient
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortConfig.field === 'createdAt'}
                    direction={sortConfig.field === 'createdAt' ? sortConfig.direction : 'asc'}
                    onClick={() => handleSort('createdAt')}
                  >
                    Admission Time
                  </TableSortLabel>
                </TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Origin Hospital</TableCell>
                <TableCell>Destination Hospital</TableCell>
                <TableCell align="center">
                  <Tooltip title="Door to ECG ≤10 min">
                    <Typography variant="caption" fontWeight="bold">
                      Door to ECG
                    </Typography>
                  </Tooltip>
                </TableCell>
                <TableCell align="center">
                  <Tooltip title="Door to Balloon: Direct ≤90min, Transfer ≤120min">
                    <Typography variant="caption" fontWeight="bold">
                      Door to Balloon
                    </Typography>
                  </Tooltip>
                </TableCell>
                <TableCell align="center">
                  <Tooltip title="Door to Needle ≤30 min (Transfer cases only)">
                    <Typography variant="caption" fontWeight="bold">
                      Door to Needle
                    </Typography>
                  </Tooltip>
                </TableCell>
                <TableCell align="center">
                  <Tooltip title="RCC Activation ≤15 min (Transfer cases only)">
                    <Typography variant="caption" fontWeight="bold">
                      RCC Activation
                    </Typography>
                  </Tooltip>
                </TableCell>
                <TableCell align="center">
                  <Tooltip title="Door In Door Out ≤30 min (Transfer cases only)">
                    <Typography variant="caption" fontWeight="bold">
                      Door In Door Out
                    </Typography>
                  </Tooltip>
                </TableCell>
                <TableCell>Completeness</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={12} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : cases.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={12} align="center">
                    <Alert severity="info">No STEMI cases found</Alert>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedCases.map((case_) => {
                  const kpis = calculateKpiStatus(case_);
                  return (
                    <TableRow key={case_.id} hover>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={2}>
                          <Avatar sx={{ bgcolor: 'primary.main' }}>
                            {case_.patient?.firstName?.[0] || 'P'}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2">
                              {formatPatientName(case_.patient)}
                            </Typography>
                            <Typography variant="caption" color="textSecondary" fontFamily="monospace">
                              {case_.patient?.nationalId ? formatNationalId(case_.patient.nationalId) : 'N/A'}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(case_.createdAt)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={case_.currentStatus.replace(/_/g, ' ')}
                          color={getStatusColor(case_.currentStatus) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {case_.originHospital.name}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {case_.originHospital.cluster}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {case_.destinationHospital?.name || 'N/A'}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {case_.destinationHospital?.cluster || ''}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <KpiIcon 
                          met={kpis.doorToEcg} 
                          applicable={case_.doorToEcgMinutes !== null && case_.doorToEcgMinutes !== undefined}
                          minutes={case_.doorToEcgMinutes}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <KpiIcon 
                          met={kpis.doorToBalloon} 
                          applicable={case_.doorToBalloonMinutes !== null && case_.doorToBalloonMinutes !== undefined}
                          minutes={case_.doorToBalloonMinutes}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <KpiIcon 
                          met={kpis.doorToNeedle} 
                          applicable={case_.caseType === 'TRANSFER' && case_.doorToNeedleMinutes !== null && case_.doorToNeedleMinutes !== undefined}
                          minutes={case_.doorToNeedleMinutes}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <KpiIcon 
                          met={kpis.rccActivation} 
                          applicable={case_.caseType === 'TRANSFER' && case_.rccActivationToDoorOutMinutes !== null && case_.rccActivationToDoorOutMinutes !== undefined}
                          minutes={case_.rccActivationToDoorOutMinutes}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <KpiIcon 
                          met={kpis.doorInDoorOut} 
                          applicable={case_.caseType === 'TRANSFER' && case_.doorInDoorOutMinutes !== null && case_.doorInDoorOutMinutes !== undefined}
                          minutes={case_.doorInDoorOutMinutes}
                        />
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <StemiCaseCompleteness stemiCase={case_ as any} />
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Box display="flex" gap={1} justifyContent="flex-end">
                          <Tooltip title="Open Outcome Form">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenOutcomeForm(case_)}
                              color="primary"
                            >
                              <OutcomeFormIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              onClick={() => onViewCase(case_)}
                              color="primary"
                            >
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit Case">
                            <IconButton
                              size="small"
                              onClick={() => onEditCase(case_)}
                              color="primary"
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Case">
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteClick(case_)}
                              color="error"
                              disabled={deletingId === case_.id}
                            >
                              {deletingId === case_.id ? (
                                <CircularProgress size={16} />
                              ) : (
                                <DeleteIcon />
                              )}
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
        </Table>
      </TableContainer>

        {/* Pagination */}
        <TablePagination
          rowsPerPageOptions={[10, 20, 50]}
          component="div"
          count={totalCases}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Rows per page:"
        />
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete STEMI Case</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this STEMI case? This action cannot be undone.
          </Typography>
          {selectedCase && (
            <Box mt={2} p={2} bgcolor="grey.100" borderRadius={1}>
              <Typography variant="subtitle2">
                Patient: {selectedCase.patient?.firstName} {selectedCase.patient?.lastName}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                National ID: {selectedCase.patient?.nationalId}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Status: {selectedCase.currentStatus.replace(/_/g, ' ')}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error" 
            variant="contained"
            disabled={deletingId !== null}
          >
            {deletingId ? <CircularProgress size={20} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Filter Dialog */}
      <LiveFilterDialog
        open={filterDialogOpen}
        onClose={() => setFilterDialogOpen(false)}
        onApply={(newFilters) => {
          setFilters(newFilters);
          onPageChange(0);
        }}
        onReset={handleClearFilters}
        fields={filterFields}
        values={filters}
        applyButtonText="Close"
        resetButtonText="Reset All"
      />

      {/* Outcome Form Dialog */}
      {outcomeFormCaseId && (
        <StemiOutcomeForm
          open={outcomeFormDialogOpen}
          onClose={handleOutcomeFormClose}
          stemiCaseId={outcomeFormCaseId}
          stemiCaseData={selectedCase}
          onSuccess={handleOutcomeFormSuccess}
        />
      )}
    </Box>
  );
};

export default StemiCasesList;
