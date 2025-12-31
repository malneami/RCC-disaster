import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  Table,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Paper,
  Typography,
  Button,
  TablePagination,
  CircularProgress,
  TextField,
  InputAdornment,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  FilterList as FilterIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  ViewModule as CardsIcon,
  TableChart as TableIcon,
} from '@mui/icons-material';
import BedsTableHeader from './BedsTableHeader';
import BedTableRow from './BedTableRow';
import BedsFilters from './BedsFilters';
import { BedListItem, BedStatus } from '../services/bedService';

export interface BedsTableProps {
  beds: BedListItem[];
  loading?: boolean;
  onBedClick?: (bed: BedListItem) => void;
  onChangeStatus?: (bed: BedListItem, newStatus: BedStatus) => void;
  onViewDetails?: (bed: BedListItem) => void;
  onEditBed?: (bed: BedListItem) => void;
  onViewHistory?: (bed: BedListItem) => void;
  onDeleteBed?: (bed: BedListItem) => void;
  isHospitalUser?: boolean;
  totalCount?: number;
  page?: number;
  rowsPerPage?: number;
  onPageChange?: (event: unknown, newPage: number) => void;
  onRowsPerPageChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  hospitals?: Array<{ id: string; name: string }>;
  units?: Array<{ id: string; name: string }>;
  appliedFilters: {
    hospitalId?: string;
    unitId: string;
    status: string;
  };
  onFiltersApplied: (filters: any) => void;
  isAdmin?: boolean;
  userHospitalId?: string | null;
  onViewModeChange?: (mode: 'table' | 'cards') => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
}

const BedsTable: React.FC<BedsTableProps> = ({
  beds,
  loading = false,
  onBedClick,
  onChangeStatus,
  onViewDetails,
  onEditBed,
  onViewHistory,
  onDeleteBed,
  isHospitalUser = false,
  isAdmin = false,
  totalCount = 0,
  page = 0,
  rowsPerPage = 10,
  onPageChange,
  onRowsPerPageChange,
  hospitals,
  units = [],
  appliedFilters,
  onFiltersApplied,
  userHospitalId,
  onViewModeChange,
  searchValue = '',
  onSearchChange,
}) => {
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [filters, setFilters] = useState(appliedFilters);
  const [searchInput, setSearchInput] = useState(searchValue);
  const [filteredBeds, setFilteredBeds] = useState<BedListItem[]>(beds);

  useEffect(() => {
    setFilters(appliedFilters);
  }, [appliedFilters]);

  useEffect(() => {
    setSearchInput(searchValue);
  }, [searchValue]);

  useEffect(() => {
    applyFiltersAndSearch();
  }, [beds, searchInput]);

  const applyFiltersAndSearch = () => {
    let filtered = beds;

    if (searchInput.trim()) {
      const query = searchInput.toLowerCase().trim();
      filtered = filtered.filter(bed => {
        const bedNumber = bed.bedNumber.toLowerCase();
        const unitName = bed.unitName.toLowerCase();
        const hospitalName = bed.hospital?.name.toLowerCase() || '';
        const patientName = bed.currentPatientName?.toLowerCase() || '';

        return bedNumber.includes(query) ||
          unitName.includes(query) ||
          hospitalName.includes(query) ||
          patientName.includes(query);
      });
    }

    setFilteredBeds(filtered);
  };

  const handleApplyFilters = () => {
    onFiltersApplied(filters);
    setFilterDialogOpen(false);
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      hospitalId: '',
      unitId: '',
      status: '',
    };
    setFilters(clearedFilters);
    onFiltersApplied(clearedFilters);
    setFilterDialogOpen(false);
  };

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    if (onSearchChange) {
      onSearchChange(value);
    }
  };

  const handleClearSearch = () => {
    handleSearchChange('');
  };

  const paginatedBeds = filteredBeds.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  if (loading && beds.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Beds
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {filteredBeds.length} of {totalCount} bed{filteredBeds.length !== 1 ? 's' : ''}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Search */}
          <TextField
            size="small"
            placeholder="Search beds..."
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
              endAdornment: searchInput && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={handleClearSearch}>
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 250 }}
          />
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
        </Box>
      </Box>

      <Card
        elevation={0}
        sx={{
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
          border: '1px solid rgba(0, 0, 0, 0.04)',
        }}
      >
        <TableContainer component={Paper} elevation={0}>
          <Table>
            <BedsTableHeader />
            <TableBody
              sx={{
                '& .MuiTableRow-root': {
                  transition: 'background-color 0.15s ease-in-out',
                },
                '& .MuiTableRow-root:nth-of-type(odd)': {
                  backgroundColor: '#F8FAFC',
                },
                '& .MuiTableRow-root:nth-of-type(even)': {
                  backgroundColor: '#FFFFFF',
                },
                '& .MuiTableRow-root:hover': {
                  backgroundColor: '#E0F2FE !important',
                },
              }}
            >
              {paginatedBeds.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      {loading ? 'Loading beds...' : 'No beds found'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedBeds.map((bed) => (
                  <BedTableRow
                    key={bed.id}
                    bed={bed}
                    onBedClick={onBedClick}
                    onChangeStatus={onChangeStatus}
                    onViewDetails={onViewDetails}
                    onEditBed={onEditBed}
                    onViewHistory={onViewHistory}
                    onDeleteBed={onDeleteBed}
                    isAdmin={isAdmin}
                    isHospitalUser={isHospitalUser}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        {totalCount > 0 && onPageChange && onRowsPerPageChange && (
          <TablePagination
            rowsPerPageOptions={[10, 25, 50, 100]}
            component="div"
            count={filteredBeds.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={onPageChange}
            onRowsPerPageChange={onRowsPerPageChange}
            labelRowsPerPage="Rows per page:"
            labelDisplayedRows={({ from, to, count }) =>
              `${from}-${to} of ${count !== -1 ? count : `more than ${to}`}`
            }
          />
        )}
      </Card>

      <BedsFilters
        open={filterDialogOpen}
        onClose={() => setFilterDialogOpen(false)}
        filters={filters}
        hospitals={hospitals}
        units={units}
        onFiltersChange={setFilters}
        onApplyFilters={handleApplyFilters}
        onClearFilters={handleClearFilters}
        isAdmin={isAdmin}
        userHospitalId={userHospitalId}
      />
    </Box>
  );
};

export default BedsTable;
