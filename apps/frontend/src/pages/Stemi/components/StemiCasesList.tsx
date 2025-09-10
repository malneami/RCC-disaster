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
} from '@mui/material';
import {
  Edit as EditIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { StemiCase, StemiFilterParams } from '../services/stemiService';
import LiveFilterDialog from './LiveFilterDialog';

interface StemiCasesListProps {
  cases: StemiCase[];
  loading: boolean;
  onEditCase: (case_: StemiCase) => void;
  onViewCase: (case_: StemiCase) => void;
  onDeleteCase: (id: string) => void;
  onCreateCase: () => void;
}

const StemiCasesList: React.FC<StemiCasesListProps> = ({
  cases,
  loading,
  onEditCase,
  onViewCase,
  onDeleteCase,
  onCreateCase,
}) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
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

  // Pagination logic
  const paginatedCases = useMemo(() => {
    const startIndex = page * rowsPerPage;
    return filteredAndSortedCases.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredAndSortedCases, page, rowsPerPage]);

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
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setRowsPerPage(newRowsPerPage);
    setPage(0);
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setFilters(prev => ({ ...prev, search: value }));
    setPage(0); // Reset to first page when searching
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
    setPage(0);
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
            {filteredAndSortedCases.length} of {cases.length} cases
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
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : cases.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Alert severity="info">No STEMI cases found</Alert>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedCases.map((case_) => (
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
                    <TableCell align="right">
                      <Box display="flex" gap={1} justifyContent="flex-end">
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
                ))
              )}
            </TableBody>
        </Table>
      </TableContainer>

        {/* Pagination */}
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredAndSortedCases.length}
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
          setPage(0);
        }}
        onReset={handleClearFilters}
        fields={filterFields}
        values={filters}
        applyButtonText="Close"
        resetButtonText="Reset All"
      />
    </Box>
  );
};

export default StemiCasesList;
