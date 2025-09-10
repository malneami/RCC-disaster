import React, { useState } from 'react';
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
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
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { StemiCase, StemiFilterParams } from '../services/stemiService';

interface StemiCasesListProps {
  cases: StemiCase[];
  loading: boolean;
  onEditCase: (case_: StemiCase) => void;
  onViewCase: (case_: StemiCase) => void;
  onDeleteCase: (id: string) => void;
  onRefresh: () => void;
  filters: StemiFilterParams;
  onFiltersChange: (filters: StemiFilterParams) => void;
}

const StemiCasesList: React.FC<StemiCasesListProps> = ({
  cases,
  loading,
  onEditCase,
  onViewCase,
  onDeleteCase,
  onRefresh,
  filters,
  onFiltersChange,
}) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  const [showFilters, setShowFilters] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState<StemiCase | null>(null);
  const [sortConfig, setSortConfig] = useState<{
    field: keyof StemiCase | 'patient';
    direction: 'asc' | 'desc';
  }>({ field: 'createdAt', direction: 'desc' });

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
    onFiltersChange({
      ...filters,
      offset: newPage * rowsPerPage,
    });
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setRowsPerPage(newRowsPerPage);
    setPage(0);
    onFiltersChange({
      ...filters,
      limit: newRowsPerPage,
      offset: 0,
    });
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchTerm(value);
    
    // Debounce search
    const timeoutId = setTimeout(() => {
      onFiltersChange({
        ...filters,
        search: value,
        offset: 0,
      });
      setPage(0);
    }, 500);

    return () => clearTimeout(timeoutId);
  };

  const handleFilterChange = (key: keyof StemiFilterParams, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value,
      offset: 0,
    });
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
    return `${patient.firstName} ${patient.lastName}`;
  };

  const formatNationalId = (nationalId: string) => {
    // Format as XXX-XXXX-XXXX
    return nationalId.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
  };

  return (
    <Box>
      {/* Search and Filters */}
      <Box display="flex" gap={2} mb={3} alignItems="center">
        <TextField
          placeholder="Search cases, patients, or ticket numbers..."
          value={searchTerm}
          onChange={handleSearch}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ flexGrow: 1 }}
        />
        <Button
          variant="outlined"
          startIcon={<FilterIcon />}
          onClick={() => setShowFilters(!showFilters)}
        >
          Filters
        </Button>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={onRefresh}
        >
          Refresh
        </Button>
      </Box>

      {/* Advanced Filters */}
      {showFilters && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Advanced Filters
          </Typography>
          <Box display="flex" gap={2} flexWrap="wrap">
            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.currentStatus || ''}
                onChange={(e) => handleFilterChange('currentStatus', e.target.value || undefined)}
                label="Status"
              >
                <MenuItem value="">All Statuses</MenuItem>
                <MenuItem value="SUSPECTED">Suspected</MenuItem>
                <MenuItem value="ECG_PENDING">ECG Pending</MenuItem>
                <MenuItem value="STEMI_CONFIRMED">STEMI Confirmed</MenuItem>
                <MenuItem value="NSTEMI_CONFIRMED">NSTEMI Confirmed</MenuItem>
                <MenuItem value="UNSTABLE_ANGINA">Unstable Angina</MenuItem>
                <MenuItem value="RCC_ACTIVATED">RCC Activated</MenuItem>
                <MenuItem value="IN_TRANSIT">In Transit</MenuItem>
                <MenuItem value="PCI_READY">PCI Ready</MenuItem>
                <MenuItem value="BALLOON_INFLATED">Balloon Inflated</MenuItem>
                <MenuItem value="CCU_ADMITTED">CCU Admitted</MenuItem>
                <MenuItem value="DISCHARGED">Discharged</MenuItem>
                <MenuItem value="EXPIRED">Expired</MenuItem>
              </Select>
            </FormControl>

            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>Treatment</InputLabel>
              <Select
                value={filters.selectedTreatment || ''}
                onChange={(e) => handleFilterChange('selectedTreatment', e.target.value || undefined)}
                label="Treatment"
              >
                <MenuItem value="">All Treatments</MenuItem>
                <MenuItem value="PRIMARY_PCI">Primary PCI</MenuItem>
                <MenuItem value="RESCUE_PCI">Rescue PCI</MenuItem>
                <MenuItem value="FIBRINOLYSIS">Fibrinolysis</MenuItem>
                <MenuItem value="TRANSFER_FOR_PRIMARY_PCI">Transfer for PCI</MenuItem>
                <MenuItem value="MEDICAL_MANAGEMENT">Medical Management</MenuItem>
              </Select>
            </FormControl>

            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>Mode of Arrival</InputLabel>
              <Select
                value={filters.modeOfArrival || ''}
                onChange={(e) => handleFilterChange('modeOfArrival', e.target.value || undefined)}
                label="Mode of Arrival"
              >
                <MenuItem value="">All Modes</MenuItem>
                <MenuItem value="AMBULANCE">Ambulance</MenuItem>
                <MenuItem value="PRIVATE_VEHICLE">Private Vehicle</MenuItem>
                <MenuItem value="AIR_TRANSPORT">Air Transport</MenuItem>
                <MenuItem value="WALK_IN">Walk In</MenuItem>
                <MenuItem value="POLICE">Police</MenuItem>
                <MenuItem value="TRANSFERRED_FROM_HOSPITAL">Transferred</MenuItem>
                <MenuItem value="OTHER">Other</MenuItem>
              </Select>
            </FormControl>

            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>ECG Result</InputLabel>
              <Select
                value={filters.ecgResult || ''}
                onChange={(e) => handleFilterChange('ecgResult', e.target.value || undefined)}
                label="ECG Result"
              >
                <MenuItem value="">All Results</MenuItem>
                <MenuItem value="PENDING">Pending</MenuItem>
                <MenuItem value="NORMAL">Normal</MenuItem>
                <MenuItem value="STEMI_ANTERIOR">STEMI Anterior</MenuItem>
                <MenuItem value="STEMI_INFERIOR">STEMI Inferior</MenuItem>
                <MenuItem value="STEMI_LATERAL">STEMI Lateral</MenuItem>
                <MenuItem value="STEMI_POSTERIOR">STEMI Posterior</MenuItem>
                <MenuItem value="NSTEMI_CHANGES">NSTEMI Changes</MenuItem>
                <MenuItem value="UNSTABLE_PATTERN">Unstable Pattern</MenuItem>
                <MenuItem value="TECHNICAL_ISSUE">Technical Issue</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Paper>
      )}

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
                cases.map((case_) => (
                  <TableRow key={case_.id} hover>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          {case_.patient.firstName?.[0] || 'P'}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2">
                            {formatPatientName(case_.patient)}
                          </Typography>
                          <Typography variant="caption" color="textSecondary" fontFamily="monospace">
                            {formatNationalId(case_.patient.nationalId)}
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
          count={-1} // We don't know the total count from the current API
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
    </Box>
  );
};

export default StemiCasesList;
