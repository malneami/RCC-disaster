import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
  Grid,
  Card,
  CardContent,
  IconButton,
  Menu,
  MenuItem,
  ToggleButton,
  ToggleButtonGroup,
  TextField,
  InputAdornment,
  TablePagination,
  Paper,
} from '@mui/material';
import {
  FilterList as FilterIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  ViewModule as CardsIcon,
  TableChart as TableIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  History as HistoryIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { BedListItem, BedStatus } from '../services/bedService';
import { BedStatusChip } from './BedStatusChip';
import BedsFilters from './BedsFilters';

interface BedsCardsProps {
  beds: BedListItem[];
  loading?: boolean;
  onViewDetails?: (bed: BedListItem) => void;
  onEditBed?: (bed: BedListItem) => void;
  onViewHistory?: (bed: BedListItem) => void;
  onDeleteBed?: (bed: BedListItem) => void;
  totalCount?: number;
  hospitals?: Array<{ id: string; name: string }>;
  units?: Array<{ id: string; name: string }>;
  appliedFilters: {
    hospitalId?: string;
    unitId: string;
    status: string;
  };
  onFiltersApplied: (filters: any) => void;
  isAdmin?: boolean;
  isHospitalUser?: boolean;
  userHospitalId?: string | null;
  onViewModeChange?: (mode: 'table' | 'cards') => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  page?: number;
  rowsPerPage?: number;
  onPageChange?: (event: unknown, newPage: number) => void;
  onRowsPerPageChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const BedsCards: React.FC<BedsCardsProps> = ({
  beds,
  loading = false,
  onViewDetails,
  onEditBed,
  onViewHistory,
  onDeleteBed,
  totalCount = 0,
  hospitals,
  units,
  appliedFilters,
  onFiltersApplied,
  isAdmin = false,
  isHospitalUser = false,
  userHospitalId,
  onViewModeChange,
  searchValue = '',
  onSearchChange,
  page = 0,
  rowsPerPage = 20,
  onPageChange,
  onRowsPerPageChange,
}) => {
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [filters, setFilters] = useState(appliedFilters);
  const [searchInput, setSearchInput] = useState(searchValue);
  const [filteredBeds, setFilteredBeds] = useState<BedListItem[]>(beds);
  const [anchorEl, setAnchorEl] = useState<{ [key: string]: HTMLElement | null }>({});

  useEffect(() => {
    setFilters(appliedFilters);
  }, [appliedFilters]);

  useEffect(() => {
    setSearchInput(searchValue);
  }, [searchValue]);

  useEffect(() => {
    applyFiltersAndSearch();
  }, [beds, filters, searchInput]);

  const applyFiltersAndSearch = () => {
    let filtered = beds;

    // Apply search
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

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, bedId: string) => {
    event.stopPropagation();
    setAnchorEl({ ...anchorEl, [bedId]: event.currentTarget });
  };

  const handleMenuClose = (bedId: string) => {
    setAnchorEl({ ...anchorEl, [bedId]: null });
  };

  const handleViewDetails = (bed: BedListItem) => {
    if (onViewDetails) {
      onViewDetails(bed);
    }
    handleMenuClose(bed.id);
  };

  const handleEditBed = (bed: BedListItem) => {
    if (onEditBed) {
      onEditBed(bed);
    }
    handleMenuClose(bed.id);
  };

  const handleDeleteBed = (bed: BedListItem) => {
    if (onDeleteBed) {
      onDeleteBed(bed);
    }
    handleMenuClose(bed.id);
  };

  const getBedStatusColor = (status: BedStatus): string => {
    switch (status) {
      case 'OCCUPIED':
        return '#f44336'; // Red
      case 'VACANT':
        return '#4caf50'; // Green
      case 'CLEANING':
        return '#ff9800'; // Yellow/Orange
      case 'BLOCKED':
        return '#9e9e9e'; // Gray
      case 'RESERVED':
        return '#2196f3'; // Blue
      default:
        return '#9e9e9e';
    }
  };

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
        </Box>
      </Box>

      {loading && filteredBeds.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <Typography color="text.secondary">Loading beds...</Typography>
        </Box>
      ) : filteredBeds.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No beds found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {searchInput || Object.values(filters).some(v => v) 
              ? 'Try adjusting your search or filters' 
              : 'No beds available'}
          </Typography>
        </Box>
      ) : (
        <>
          <Grid container spacing={3}>
            {filteredBeds
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((bed) => {
                const statusColor = getBedStatusColor(bed.status);
                return (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={bed.id}>
                    <Card
                      sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        position: 'relative',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        borderRadius: 2,
                        border: `1px solid ${statusColor}20`,
                        background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                        '&:hover': {
                          elevation: 8,
                          transform: 'translateY(-4px)',
                          boxShadow: `0 8px 25px ${statusColor}30`,
                          border: `1px solid ${statusColor}40`,
                        },
                      }}
                    >
                      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                        {/* Header with bed name and menu */}
                        <Box 
                          sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'flex-start', 
                            mb: 2,
                            background: `linear-gradient(135deg, ${statusColor}10 0%, ${statusColor}05 100%)`,
                            borderRadius: 1,
                            p: 1.5,
                            border: `1px solid ${statusColor}15`,
                          }}
                        >
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography 
                              variant="h6" 
                              component="div" 
                              fontWeight={700}
                              sx={{ 
                                color: statusColor,
                                fontSize: { xs: '1rem', sm: '1.1rem' },
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {bed.bedNumber}
                            </Typography>
                            <Box sx={{ mt: 0.5 }}>
                              <BedStatusChip status={bed.status} />
                            </Box>
                          </Box>
                          <IconButton
                            size="small"
                            onClick={(e) => handleMenuClick(e, bed.id)}
                            sx={{ ml: 1, flexShrink: 0 }}
                          >
                            <MoreVertIcon fontSize="small" />
                          </IconButton>
                          <Menu
                            anchorEl={anchorEl[bed.id]}
                            open={Boolean(anchorEl[bed.id])}
                            onClose={() => handleMenuClose(bed.id)}
                            anchorOrigin={{
                              vertical: 'bottom',
                              horizontal: 'right',
                            }}
                            transformOrigin={{
                              vertical: 'top',
                              horizontal: 'right',
                            }}
                          >
                            <MenuItem onClick={() => handleViewDetails(bed)}>
                              <ViewIcon fontSize="small" sx={{ mr: 1 }} />
                              View Bed
                            </MenuItem>
                            <MenuItem onClick={() => onViewHistory?.(bed)}>
                              <HistoryIcon fontSize="small" sx={{ mr: 1 }} />
                              History
                            </MenuItem>
                            {!isAdmin && (
                              <MenuItem onClick={() => handleEditBed(bed)}>
                                <EditIcon fontSize="small" sx={{ mr: 1 }} />
                                Edit Bed
                              </MenuItem>
                            )}
                        {isHospitalUser && (
                          <MenuItem onClick={() => handleDeleteBed(bed)} sx={{ color: 'error.main' }}>
                            <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
                            Delete Bed
                          </MenuItem>
                        )}
                          </Menu>
                        </Box>

                        <Box sx={{ mt: 2 }}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Unit
                          </Typography>
                          <Typography variant="body1" fontWeight={500}>
                            {bed.unitName}
                          </Typography>
                        </Box>

                        {bed.hospital && (
                          <Box sx={{ mt: 2 }}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              Hospital
                            </Typography>
                            <Typography variant="body1">
                              {bed.hospital.name}
                            </Typography>
                          </Box>
                        )}

                        {bed.currentPatientName && (
                          <Box sx={{ mt: 2 }}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              Patient
                            </Typography>
                            <Typography variant="body1" fontWeight={500}>
                              {bed.currentPatientName}
                            </Typography>
                          </Box>
                        )}

                        <Box sx={{ mt: 2 }}>
                          <Chip
                            label={bed.isOperational ? 'Operational' : 'Not Operational'}
                            color={bed.isOperational ? 'success' : 'error'}
                            size="small"
                          />
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
          </Grid>
          
          {onPageChange && onRowsPerPageChange && (
            <Box sx={{ mt: 2 }}>
              <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                <TablePagination
                  rowsPerPageOptions={[6, 12, 24, 48]}
                  component="div"
                  count={filteredBeds.length}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={onPageChange}
                  onRowsPerPageChange={onRowsPerPageChange}
                  labelRowsPerPage="Cards per page:"
                  labelDisplayedRows={({ from, to, count }) =>
                    `${from}-${to} of ${count !== -1 ? count : `more than ${to}`}`
                  }
                />
              </Paper>
            </Box>
          )}
        </>
      )}

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

export default BedsCards;
