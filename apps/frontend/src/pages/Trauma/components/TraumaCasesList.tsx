import React, { useState, useMemo } from 'react';
import {
  Box,
  Card,
  Typography,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  Paper,
  Tooltip,
  Alert,
  CircularProgress,
  Avatar,
  ToggleButton,
  ToggleButtonGroup,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Search,
  FilterList,
  Delete,
  Visibility,
  Add,
  Person,
  LocalHospital,
  Warning,
  TransferWithinAStation,
  Edit,
  ViewModule as CardsIcon,
  TableChart as TableIcon,
  MoreVert as MoreVertIcon,
  NoteAdd as NoteAddIcon,
  Comment as CommentIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';

import { TraumaCase, TraumaService } from '../../../services/traumaService';
import GenericFilterDialog from '../../../components/Common/GenericFilterDialog';
import EditTraumaCaseDialog from './EditTraumaCaseDialog';
import ViewTraumaCaseDialog from './ViewTraumaCaseDialog';
import CaseNoteModal from '../../../pages/NotificationCenter/components/CaseNoteModal';
import { notificationService } from '../../../services/notificationService';

interface TraumaCasesListProps {
  cases: TraumaCase[];
  onCreateCase: () => void;
  onDeleteCase: (id: string) => Promise<void>;
  onUpdateCase: (id: string, data: any) => Promise<void>;
  onAddCaseNote?: (case_: TraumaCase) => void;
  isAdmin: boolean;
  onViewModeChange?: (mode: 'table' | 'cards') => void;
}

interface FilterOptions {
  search: string;
  modeOfArrival: string;
  mechanismOfInjury: string;
  edDisposition: string;
  criticalCase: boolean | null;
  transferCase: boolean | null;
  dateFrom: string;
  dateTo: string;
  hospitalId: string;
}

interface SortConfig {
  field: keyof TraumaCase;
  direction: 'asc' | 'desc';
}

const TraumaCasesList: React.FC<TraumaCasesListProps> = ({
  cases,
  onCreateCase,
  onDeleteCase,
  onUpdateCase,
  onAddCaseNote,
  isAdmin,
  onViewModeChange,
}) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: 'createdAt',
    direction: 'desc',
  });
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState<TraumaCase | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedCaseForMenu, setSelectedCaseForMenu] = useState<TraumaCase | null>(null);
  const [showCaseNoteModal, setShowCaseNoteModal] = useState(false);

  const [filters, setFilters] = useState<FilterOptions>({
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

  // Filter and sort cases
  const filteredAndSortedCases = useMemo(() => {
    let filtered = cases.filter((case_) => {
      // Search filter
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

      // Other filters
      if (filters.modeOfArrival && case_.modeOfArrival !== filters.modeOfArrival) return false;
      if (filters.mechanismOfInjury && case_.mechanismOfInjury !== filters.mechanismOfInjury) return false;
      if (filters.edDisposition && case_.edDisposition !== filters.edDisposition) return false;
      if (filters.criticalCase !== null && case_.criticalCase !== filters.criticalCase) return false;
      if (filters.transferCase !== null && case_.transferCase !== filters.transferCase) return false;
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

    // Sort
    filtered.sort((a, b) => {
      const aValue = a[sortConfig.field];
      const bValue = b[sortConfig.field];
      
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      if (aValue instanceof Date && bValue instanceof Date) {
        return sortConfig.direction === 'asc' 
          ? aValue.getTime() - bValue.getTime()
          : bValue.getTime() - aValue.getTime();
      }
      
      return 0;
    });

    return filtered;
  }, [cases, filters, sortConfig]);

  // Pagination
  const paginatedCases = filteredAndSortedCases.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const handleSort = (field: keyof TraumaCase) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleFilterChange = (newFilters: Partial<FilterOptions>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPage(0);
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
    setPage(0);
  };

  const handleViewDetails = (case_: TraumaCase) => {
    setSelectedCase(case_);
    setViewDialogOpen(true);
  };

  const handleEditCase = async (case_: TraumaCase) => {
    try {
      setLoading(true);
      // Fetch the latest case data directly from the API to ensure we have the most up-to-date data
      const latestCase = await TraumaService.getTraumaCaseById(case_.id);
      setSelectedCase(latestCase);
      setEditDialogOpen(true);
    } catch (err) {
      console.error('Error fetching latest case data:', err);
      // Fallback to using the case from the table if API call fails
      const fallbackCase = cases.find(c => c.id === case_.id) || case_;
      setSelectedCase(fallbackCase);
      setEditDialogOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCase = async (id: string, data: any) => {
    try {
      setLoading(true);
      setError(null);
      await onUpdateCase(id, data);
      // Refresh the selected case by fetching it again from the API
      if (selectedCase && selectedCase.id === id) {
        try {
          const refreshedCase = await TraumaService.getTraumaCaseById(id);
          setSelectedCase(refreshedCase);
        } catch (refreshErr) {
          console.error('Error refreshing selected case:', refreshErr);
        }
      }
      setEditDialogOpen(false);
    } catch (err) {
      setError('Failed to update trauma case');
      console.error('Error updating trauma case:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (case_: TraumaCase) => {
    setSelectedCase(case_);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedCase) return;
    
    try {
      setLoading(true);
      setError(null);
      await onDeleteCase(selectedCase.id);
      setDeleteDialogOpen(false);
    } catch (err) {
      setError('Failed to delete trauma case');
      console.error('Error deleting trauma case:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, case_: TraumaCase) => {
    setMenuAnchorEl(event.currentTarget);
    setSelectedCaseForMenu(case_);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedCaseForMenu(null);
  };

  const handleViewDetailsFromMenu = () => {
    if (selectedCaseForMenu) {
      handleViewDetails(selectedCaseForMenu);
    }
    handleMenuClose();
  };

  const handleEditCaseFromMenu = () => {
    if (selectedCaseForMenu) {
      handleEditCase(selectedCaseForMenu);
    }
    handleMenuClose();
  };

  const handleDeleteCaseFromMenu = () => {
    if (selectedCaseForMenu) {
      handleDeleteClick(selectedCaseForMenu);
    }
    handleMenuClose();
  };

  const handleAddCaseNoteFromMenu = () => {
    setShowCaseNoteModal(true);
    setMenuAnchorEl(null); // Close menu but don't clear selectedCaseForMenu yet
  };

  const handleCaseNoteSubmit = async (data: any) => {
    try {
      await notificationService.createCaseNote(data);
      setShowCaseNoteModal(false);
      // Optionally refresh data or show success message
    } catch (error) {
      console.error('Failed to create case note:', error);
      // Handle error - could show a toast notification
    }
  };

  const getSeverityColor = (severity: string | undefined) => {
    switch (severity) {
      case 'MINOR': return 'success';
      case 'MODERATE': return 'warning';
      case 'SEVERE': return 'error';
      case 'CRITICAL': return 'error';
      default: return 'default';
    }
  };

  const getModeOfArrivalIcon = (mode: string) => {
    switch (mode) {
      case 'AMBULANCE': return <TransferWithinAStation />;
      case 'WALK_IN': return <Person />;
      case 'PRIVATE_VEHICLE': return <Person />;
      case 'HELICOPTER': return <TransferWithinAStation />;
      case 'POLICE': return <Person />;
      default: return <Person />;
    }
  };


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
      options: [
        { value: 'AMBULANCE', label: 'Ambulance' },
        { value: 'WALK_IN', label: 'Walk-in' },
        { value: 'PRIVATE_VEHICLE', label: 'Private Vehicle' },
        { value: 'HELICOPTER', label: 'Helicopter' },
        { value: 'POLICE', label: 'Police' },
      ],
    },
    {
      key: 'mechanismOfInjury',
      label: 'Mechanism of Injury',
      type: 'select' as const,
      options: [
        { value: 'MOTOR_VEHICLE_ACCIDENT', label: 'Motor Vehicle Accident' },
        { value: 'FALL', label: 'Fall' },
        { value: 'PENETRATING_INJURY', label: 'Penetrating Injury' },
        { value: 'BURN', label: 'Burn' },
        { value: 'ASSAULT', label: 'Assault' },
        { value: 'SPORTS_INJURY', label: 'Sports Injury' },
        { value: 'OTHER', label: 'Other' },
      ],
    },
    {
      key: 'edDisposition',
      label: 'ED Disposition',
      type: 'select' as const,
      options: [
        { value: 'DISCHARGED', label: 'Discharged' },
        { value: 'ADMITTED', label: 'Admitted' },
        { value: 'TRANSFERRED', label: 'Transferred' },
        { value: 'LEFT_AMA', label: 'Left AMA' },
        { value: 'DECEASED', label: 'Deceased' },
      ],
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

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Trauma Cases
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {filteredAndSortedCases.length} of {cases.length} cases
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<FilterList />}
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
            startIcon={<Add />}
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
          placeholder="Search trauma cases..."
          value={filters.search}
          onChange={(e) => handleFilterChange({ search: e.target.value })}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Cases Table */}
      <Card>
        <TableContainer component={Paper} elevation={0}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  <TableSortLabel
                    active={sortConfig.field === 'patient'}
                    direction={sortConfig.field === 'patient' ? sortConfig.direction : 'asc'}
                    onClick={() => handleSort('patient' as keyof TraumaCase)}
                  >
                    Patient
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortConfig.field === 'arrivalDateTime'}
                    direction={sortConfig.field === 'arrivalDateTime' ? sortConfig.direction : 'asc'}
                    onClick={() => handleSort('arrivalDateTime')}
                  >
                    Arrival Time
                  </TableSortLabel>
                </TableCell>
                <TableCell>Mode of Arrival</TableCell>
                <TableCell>Mechanism</TableCell>
                <TableCell>GCS Score</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Hospital</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedCases.map((case_) => (
                <TableRow key={case_.id} hover>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1} justifyContent="space-between">
                      <Box 
                        display="flex" 
                        alignItems="center" 
                        gap={2} 
                        flex={1}
                      >
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          {case_.patient?.firstName?.[0] || 'P'}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" sx={{ color: '#1976d2', cursor: 'pointer' }} onClick={() => handleViewDetails(case_)}>
                            {case_.patient?.firstName} {case_.patient?.lastName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ID: {case_.patient?.nationalId || 'N/A'}
                          </Typography>
                        </Box>
                      </Box>
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuClick(e, case_)}
                        sx={{ ml: 1 }}
                      >
                        <MoreVertIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2">
                        {format(new Date(case_.arrivalDateTime), 'MMM dd, yyyy')}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {format(new Date(case_.arrivalDateTime), 'HH:mm')}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      {getModeOfArrivalIcon(case_.modeOfArrival)}
                      <Typography variant="body2">
                        {TraumaService.getModeOfArrivalLabel(case_.modeOfArrival)}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {TraumaService.getMechanismOfInjuryLabel(case_.mechanismOfInjury)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="body2">
                        {case_.glasgowComaScale || 'N/A'}
                      </Typography>
                      {case_.criticalCase && (
                        <Tooltip title="Critical Case">
                          <Warning color="error" fontSize="small" />
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" gap={1}>
                      {case_.edDisposition && (
                        <Chip
                          label={TraumaService.getDispositionLabel(case_.edDisposition)}
                          size="small"
                          color={getSeverityColor(case_.edDisposition)}
                        />
                      )}
                      {case_.transferCase && (
                        <Chip
                          label="Transfer"
                          size="small"
                          color="info"
                          icon={<TransferWithinAStation />}
                        />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <LocalHospital fontSize="small" color="action" />
                      <Typography variant="body2">
                        {case_.originHospital?.name || 'N/A'}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {/* Actions moved to 3-dots menu */}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredAndSortedCases.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Card>

      {/* Action Menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={handleViewDetailsFromMenu}>
          <Visibility fontSize="small" sx={{ mr: 1 }} />
          View Details
        </MenuItem>
        {onAddCaseNote && (
          <MenuItem onClick={handleAddCaseNoteFromMenu}>
            <CommentIcon fontSize="small" sx={{ mr: 1 }} />
            Add Case Note
          </MenuItem>
        )}
        <MenuItem onClick={handleEditCaseFromMenu}>
          <Edit fontSize="small" sx={{ mr: 1 }} />
          Edit Case
        </MenuItem>
        {isAdmin && (
          <MenuItem onClick={handleDeleteCaseFromMenu} sx={{ color: 'error.main' }}>
            <Delete fontSize="small" sx={{ mr: 1 }} />
            Delete Case
          </MenuItem>
        )}
      </Menu>


      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Trauma Case</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this trauma case? This action cannot be undone.
          </Typography>
          {selectedCase && (
            <Box mt={2} p={2} bgcolor="grey.100" borderRadius={1}>
              <Typography variant="subtitle2">
                Patient: {selectedCase.patient?.firstName} {selectedCase.patient?.lastName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Arrival: {format(new Date(selectedCase.arrivalDateTime), 'MMM dd, yyyy HH:mm')}
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
            disabled={loading}
          >
            {loading ? <CircularProgress size={20} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Filter Dialog */}
      <GenericFilterDialog
        open={filterDialogOpen}
        onClose={() => setFilterDialogOpen(false)}
        onApply={(newFilters) => {
          handleFilterChange(newFilters);
          setFilterDialogOpen(false);
        }}
        onReset={handleClearFilters}
        fields={filterFields}
        values={filters}
      />

      {/* Edit Dialog */}
      <EditTraumaCaseDialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        onSubmit={handleUpdateCase}
        traumaCase={selectedCase}
      />

      {/* View Dialog */}
      <ViewTraumaCaseDialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        traumaCase={selectedCase}
      />

      {/* Case Note Modal */}
      <CaseNoteModal
        open={showCaseNoteModal}
        onClose={() => {
          setShowCaseNoteModal(false);
          setSelectedCaseForMenu(null); // Clear selected case when modal closes
        }}
        onSubmit={handleCaseNoteSubmit}
        patientName={selectedCaseForMenu ? `${selectedCaseForMenu.patient?.firstName || ''} ${selectedCaseForMenu.patient?.lastName || ''}`.trim() : ''}
        caseType="TRAUMA"
        caseId={selectedCaseForMenu?.id || ''}
        patientId={selectedCaseForMenu?.patientId || ''}
        ticketId={selectedCaseForMenu?.ticketId}
      />
    </Box>
  );
};

export default TraumaCasesList;
