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
} from '@mui/material';
import {
  Add as AddIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { Dialog, DialogTitle, DialogContent, DialogActions, DialogContentText } from '@mui/material';

import { StrokeCase, StrokeService } from '../../../services/strokeService';
import StrokeCaseDetailsDialog from './StrokeCaseDetailsDialog';
import EditStrokeCaseDialog from './EditStrokeCaseDialog';
import StrokeCasesFilters from './StrokeCasesList/StrokeCasesFilters';
import StrokeCaseTableRow from './StrokeCasesList/StrokeCaseTableRow';
import StrokeCasesTableHeader from './StrokeCasesList/StrokeCasesTableHeader';

interface StrokeCasesListProps {
  cases: StrokeCase[];
  onUpdateCase: (id: string, data: any) => Promise<void>;
  onCreateCase: () => void;
  onDeleteCase?: (id: string) => Promise<void>;
  isAdmin?: boolean;
}

const StrokeCasesList: React.FC<StrokeCasesListProps> = ({
  cases,
  onUpdateCase,
  onCreateCase,
  onDeleteCase,
  isAdmin = false,
}) => {
  const [selectedCase, setSelectedCase] = useState<StrokeCase | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [caseToDelete, setCaseToDelete] = useState<StrokeCase | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [filteredCases, setFilteredCases] = useState<StrokeCase[]>(cases);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    strokeType: '',
    status: '',
    severity: '',
  });

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
    if (filters.severity) {
      filtered = filtered.filter(case_ => case_.strokeSeverity === filters.severity);
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
  };

  const handleClearFilters = () => {
    setFilters({ strokeType: '', status: '', severity: '' });
    setSearchQuery('');
    applyFiltersAndSearch();
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const handleCloseDetailsDialog = () => {
    setDetailsDialogOpen(false);
    setSelectedCase(null);
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setSelectedCase(null);
  };

  const handleEditFromDetails = (strokeCase: StrokeCase) => {
    setDetailsDialogOpen(false);
    setSelectedCase(strokeCase);
    setEditDialogOpen(true);
  };

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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">
          Stroke Cases ({filteredCases.length})
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<FilterIcon />}
            onClick={() => setFilterDialogOpen(true)}
          >
            Filter
          </Button>
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
                <IconButton onClick={handleClearSearch} size="small">
                  <ClearIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* Active Filters Alert */}
      {(filters.strokeType || filters.status || filters.severity || searchQuery) && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {searchQuery && `Search: "${searchQuery}"`}
          {(filters.strokeType || filters.status || filters.severity) && (
            <>
              {searchQuery && ' • '}
              Filters: {[
                filters.strokeType && `Type: ${filters.strokeType}`,
                filters.status && `Status: ${filters.status}`,
                filters.severity && `Severity: ${filters.severity}`,
              ].filter(Boolean).join(', ')}
            </>
          )}
          <Button size="small" onClick={handleClearFilters} sx={{ ml: 1 }}>
            Clear All
          </Button>
        </Alert>
      )}

      {/* Cases Table */}
      <TableContainer component={Paper}>
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
                isAdmin={isAdmin}
              />
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialogs */}
      <StrokeCasesFilters
        open={filterDialogOpen}
        onClose={() => setFilterDialogOpen(false)}
        filters={filters}
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