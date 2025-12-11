import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableContainer,
  Paper,
  Alert,
  TextField,
  InputAdornment,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
  TablePagination,
  Card,
} from '@mui/material';
import {
  Add as AddIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  ViewModule as CardsIcon,
  TableChart as TableIcon,
} from '@mui/icons-material';
import { Dialog, DialogTitle, DialogContent, DialogActions, DialogContentText } from '@mui/material';

import { StrokeCase, StrokeService } from '../../../services/strokeService';
import StrokeCaseDetailsDialog from './StrokeCaseDetailsDialog';
import EditStrokeCaseDialog from './EditStrokeCaseDialog';
import StrokeOutcomeForm from './StrokeOutcomeForm';
import StrokeCasesFilters from './StrokeCasesList/StrokeCasesFilters';
import StrokeCaseTableRow from './StrokeCasesList/StrokeCaseTableRow';
import StrokeCasesTableHeader from './StrokeCasesList/StrokeCasesTableHeader';

interface StrokeCasesListProps {
  cases: StrokeCase[];
  onUpdateCase: (id: string, data: any) => Promise<void>;
  onCreateCase: () => void;
  onDeleteCase?: (id: string) => Promise<void>;
  onAddCaseNote?: (case_: StrokeCase) => void;
  isAdmin?: boolean;
  onViewModeChange?: (mode: 'table' | 'cards') => void;
  totalCount: number;
  page: number;
  rowsPerPage: number;
  onPageChange: (event: unknown, newPage: number) => void;
  onRowsPerPageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onFiltersApplied?: (filters: {
    strokeType: string;
    status: string;
    originHospitalId: string;
    destinationHospitalId: string;
    modeOfArrival: string;
    dateFrom: string;
    dateTo: string;
  }) => void;
  hospitals: Array<{ id: string; name: string }>;
  appliedFilters: {
    strokeType: string;
    status: string;
    originHospitalId: string;
    destinationHospitalId: string;
    modeOfArrival: string;
    dateFrom: string;
    dateTo: string;
  };
  searchValue: string;
  onSearchChange?: (value: string) => void;
}

const StrokeCasesList: React.FC<StrokeCasesListProps> = ({
  cases,
  onUpdateCase,
  onCreateCase,
  onDeleteCase,
  onAddCaseNote,
  isAdmin = false,
  onViewModeChange,
  totalCount,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  onFiltersApplied,
  hospitals,
  appliedFilters,
  searchValue,
  onSearchChange,
}) => {
  const [selectedCase, setSelectedCase] = useState<StrokeCase | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [outcomeFormDialogOpen, setOutcomeFormDialogOpen] = useState(false);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [caseToDelete, setCaseToDelete] = useState<StrokeCase | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [filteredCases, setFilteredCases] = useState<StrokeCase[]>(cases);
  const [filters, setFilters] = useState({
    strokeType: appliedFilters.strokeType,
    status: appliedFilters.status,
    originHospitalId: appliedFilters.originHospitalId,
    destinationHospitalId: appliedFilters.destinationHospitalId,
    modeOfArrival: appliedFilters.modeOfArrival,
    dateFrom: appliedFilters.dateFrom,
    dateTo: appliedFilters.dateTo,
  });
  const [searchInput, setSearchInput] = useState(searchValue);

  useEffect(() => {
    applyFiltersAndSearch();
  }, [cases, filters]);

  useEffect(() => {
    // Keep local filter UI in sync with filters applied at portal level
    setFilters({
      strokeType: appliedFilters.strokeType,
      status: appliedFilters.status,
      originHospitalId: appliedFilters.originHospitalId,
      destinationHospitalId: appliedFilters.destinationHospitalId,
      modeOfArrival: appliedFilters.modeOfArrival,
      dateFrom: appliedFilters.dateFrom,
      dateTo: appliedFilters.dateTo,
    });
  }, [appliedFilters]);

  useEffect(() => {
    // Keep local search input in sync with portal-level search term
    setSearchInput(searchValue);
  }, [searchValue]);

  const applyFiltersAndSearch = () => {
    let filtered = cases;

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

  const handleViewDetails = (case_: StrokeCase) => {
    setSelectedCase(case_);
    setDetailsDialogOpen(true);
  };

  const handleEditCase = (case_: StrokeCase) => {
    setSelectedCase(case_);
    setEditDialogOpen(true);
  };

  const handleOpenOutcomeForm = (case_: StrokeCase) => {
    setSelectedCase(case_);
    setOutcomeFormDialogOpen(true);
  };

  const handleDeleteCase = (case_: StrokeCase) => {
    setCaseToDelete(case_);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!caseToDelete || !onDeleteCase) return;

    try {
      setDeleting(true);
      await onDeleteCase(caseToDelete.id);
      setDeleteDialogOpen(false);
      setCaseToDelete(null);
    } catch (error) {
      console.error('Error deleting case:', error);
    } finally {
      setDeleting(false);
    }
  };

  const cancelDelete = () => {
    setDeleteDialogOpen(false);
    setCaseToDelete(null);
  };

  const handleApplyFilters = () => {
    applyFiltersAndSearch();
    if (onFiltersApplied) {
      onFiltersApplied(filters);
    }
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
    if (onSearchChange) {
      onSearchChange('');
    }
    applyFiltersAndSearch();
    if (onFiltersApplied) {
      onFiltersApplied({
        strokeType: '',
        status: '',
        originHospitalId: '',
        destinationHospitalId: '',
        modeOfArrival: '',
        dateFrom: '',
        dateTo: '',
      });
    }
  };

  const handleClearSearch = () => {
    if (onSearchChange) {
      onSearchChange('');
    }
    setSearchInput('');
  };

  const handleCloseDetailsDialog = () => {
    setDetailsDialogOpen(false);
    setSelectedCase(null);
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setSelectedCase(null);
  };

  const handleCloseOutcomeFormDialog = () => {
    setOutcomeFormDialogOpen(false);
    setSelectedCase(null);
  };

  const handleOutcomeFormSuccess = () => {
    // Refresh the cases list or update the specific case
    // This could trigger a parent component refresh
    setOutcomeFormDialogOpen(false);
    setSelectedCase(null);
  };

  const handleEditFromDetails = (strokeCase: StrokeCase) => {
    setDetailsDialogOpen(false);
    setSelectedCase(strokeCase);
    setEditDialogOpen(true);
  };

  // Only show the big "No stroke cases found" empty state when there is truly
  // no data and no active filters/search. If user has searched or applied
  // filters, keep the table layout (with 0 rows) so they can adjust criteria.
  const hasActiveFiltersOrSearch =
    !!searchValue ||
    !!filters.strokeType ||
    !!filters.status ||
    !!filters.originHospitalId ||
    !!filters.destinationHospitalId ||
    !!filters.dateFrom ||
    !!filters.dateTo;

  if (cases.length === 0 && !hasActiveFiltersOrSearch) {
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Stroke Cases
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {filteredCases.length} of {totalCount} cases
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
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search stroke cases..."
          value={searchInput}
          onChange={(e) => {
            setSearchInput(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && onSearchChange) {
              onSearchChange(searchInput.trim());
            }
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: searchValue && (
              <InputAdornment position="end">
                <IconButton onClick={handleClearSearch} size="small">
                  <ClearIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* Active Filters Alert */}
      {(filters.strokeType || filters.status || filters.originHospitalId || filters.destinationHospitalId || filters.modeOfArrival || filters.dateFrom || filters.dateTo || searchValue) && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {searchValue && `Search: "${searchValue}"`}
          {(filters.strokeType || filters.status || filters.originHospitalId || filters.destinationHospitalId || filters.modeOfArrival || filters.dateFrom || filters.dateTo) && (
            <>
              {searchValue && ' • '}
              Filters: {[
                filters.strokeType && `Type: ${filters.strokeType}`,
                filters.status && `Status: ${filters.status}`,
                filters.originHospitalId && `Origin Hospital: ${hospitals.find(h => h.id === filters.originHospitalId)?.name || 'Unknown'}`,
                filters.destinationHospitalId && `Destination Hospital: ${hospitals.find(h => h.id === filters.destinationHospitalId)?.name || 'Unknown'}`,
                filters.modeOfArrival && `Mode of Arrival: ${StrokeService.getModeOfArrivalLabel(filters.modeOfArrival as any)}`,
                filters.dateFrom && `From: ${new Date(filters.dateFrom).toLocaleDateString()}`,
                filters.dateTo && `To: ${new Date(filters.dateTo).toLocaleDateString()}`,
              ].filter(Boolean).join(', ')}
            </>
          )}
          <Button size="small" onClick={handleClearFilters} sx={{ ml: 1 }}>
            Clear All
          </Button>
        </Alert>
      )}

      {/* Cases Table */}
      <Card elevation={0}>
        <TableContainer component={Paper} elevation={0}>
          <Table>
            <StrokeCasesTableHeader />
            <TableBody>
              {filteredCases.map((strokeCase) => (
                <StrokeCaseTableRow
                  key={strokeCase.id}
                  strokeCase={strokeCase}
                  onViewDetails={handleViewDetails}
                  onEditCase={handleEditCase}
                  onDeleteCase={handleDeleteCase}
                  onOpenOutcomeForm={handleOpenOutcomeForm}
                  onAddCaseNote={onAddCaseNote}
                  isAdmin={isAdmin}
                />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 15, 20]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={onPageChange}
          onRowsPerPageChange={onRowsPerPageChange}
          labelRowsPerPage="Rows per page:"
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} of ${count !== -1 ? count : `more than ${to}`}`
          }
        />
      </Card>

      {/* Dialogs */}
      <StrokeCasesFilters
        open={filterDialogOpen}
        onClose={() => setFilterDialogOpen(false)}
        filters={filters}
        hospitals={hospitals}
        onFiltersChange={setFilters}
        onApplyFilters={handleApplyFilters}
        onClearFilters={handleClearFilters}
      />

      <StrokeCaseDetailsDialog
        open={detailsDialogOpen}
        onClose={handleCloseDetailsDialog}
        strokeCase={selectedCase}
        onEdit={handleEditFromDetails}
      />

      <EditStrokeCaseDialog
        open={editDialogOpen}
        onClose={handleCloseEditDialog}
        strokeCase={selectedCase}
        onUpdate={onUpdateCase}
      />

      <StrokeOutcomeForm
        open={outcomeFormDialogOpen}
        onClose={handleCloseOutcomeFormDialog}
        strokeCaseId={selectedCase?.id || ''}
        strokeCaseData={selectedCase}
        onSuccess={handleOutcomeFormSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={cancelDelete}>
        <DialogTitle>Delete Stroke Case</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this stroke case? This action cannot be undone.
            <br /><br />
            <strong>Patient:</strong> {caseToDelete?.patient?.firstName} {caseToDelete?.patient?.lastName}
            <br />
            <strong>Case ID:</strong> {caseToDelete?.id}
            <br />
            <strong>Stroke Type:</strong> {caseToDelete?.strokeType}
            <br />
            <strong>Status:</strong> {caseToDelete?.currentStatus}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelDelete} disabled={deleting}>
            Cancel
          </Button>
          <Button 
            onClick={confirmDelete} 
            color="error" 
            variant="contained"
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StrokeCasesList;