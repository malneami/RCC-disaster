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
} from '@mui/material';
import {
  Add as AddIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';

import { StrokeCase } from '../../../services/strokeService';
import StrokeCaseDetailsDialog from './StrokeCaseDetailsDialog';
import EditStrokeCaseDialog from './EditStrokeCaseDialog';
import StrokeCasesFilters from './StrokeCasesList/StrokeCasesFilters';
import StrokeCaseTableRow from './StrokeCasesList/StrokeCaseTableRow';
import StrokeCasesTableHeader from './StrokeCasesList/StrokeCasesTableHeader';

interface StrokeCasesListProps {
  cases: StrokeCase[];
  onUpdateCase: (id: string, data: any) => Promise<void>;
  onCreateCase: () => void;
}

const StrokeCasesList: React.FC<StrokeCasesListProps> = ({
  cases,
  onUpdateCase,
  onCreateCase,
}) => {
  const [selectedCase, setSelectedCase] = useState<StrokeCase | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [filteredCases, setFilteredCases] = useState<StrokeCase[]>(cases);
  const [filters, setFilters] = useState({
    strokeType: '',
    status: '',
    severity: '',
  });

  useEffect(() => {
    setFilteredCases(cases);
  }, [cases]);

  const handleViewDetails = (case_: StrokeCase) => {
    setSelectedCase(case_);
    setDetailsDialogOpen(true);
  };

  const handleEditCase = (case_: StrokeCase) => {
    setSelectedCase(case_);
    setEditDialogOpen(true);
  };

  const handleApplyFilters = () => {
    let filtered = cases;

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

  const handleClearFilters = () => {
    setFilters({ strokeType: '', status: '', severity: '' });
    setFilteredCases(cases);
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

      {/* Active Filters Alert */}
      {(filters.strokeType || filters.status || filters.severity) && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Filters applied: {[
            filters.strokeType && `Type: ${filters.strokeType}`,
            filters.status && `Status: ${filters.status}`,
            filters.severity && `Severity: ${filters.severity}`,
          ].filter(Boolean).join(', ')}
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
    </Box>
  );
};

export default StrokeCasesList;