import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
  Grid,
  Alert,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  Avatar,
  Chip,
  Tooltip,
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  FilterList as FilterIcon,
  Add as AddIcon,
  ViewModule as CardsIcon,
  TableChart as TableIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import UnifiedCaseCard, { 
  UnifiedCaseCardProps, 
  PatientInfo, 
  TimeMetric, 
  PerformanceIndicator, 
  CaseAction 
} from './UnifiedCaseCard';

export type ViewMode = 'table' | 'cards';

export interface UnifiedCasesListProps<T> {
  // Data
  cases: T[];
  loading?: boolean;
  error?: string | null;
  
  // View Configuration
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  
  // Search and Filtering
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onClearSearch: () => void;
  
  // Actions
  onCreateCase: () => void;
  onRefresh?: () => void;
  
  // Case Transformation
  transformCase: (case_: T) => UnifiedCaseCardProps;
  
  // Table Configuration (when in table mode)
  tableColumns?: Array<{
    key: string;
    label: string;
    sortable?: boolean;
    render?: (case_: T) => React.ReactNode;
  }>;
  
  // Pagination
  page?: number;
  rowsPerPage?: number;
  onPageChange?: (page: number) => void;
  onRowsPerPageChange?: (rowsPerPage: number) => void;
  
  // Sorting
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  onSortChange?: (field: string, direction: 'asc' | 'desc') => void;
  
  // Styling
  title?: string;
  subtitle?: string;
  emptyMessage?: string;
  emptyActionLabel?: string;
}

function UnifiedCasesList<T>({
  cases,
  loading = false,
  error = null,
  viewMode,
  onViewModeChange,
  searchQuery,
  onSearchChange,
  onClearSearch,
  onCreateCase,
  onRefresh,
  transformCase,
  tableColumns = [],
  page = 0,
  rowsPerPage = 10,
  onPageChange,
  onRowsPerPageChange,
  sortField,
  sortDirection = 'asc',
  onSortChange,
  title = 'Cases',
  subtitle,
  emptyMessage = 'No cases found',
  emptyActionLabel = 'Create Case',
}: UnifiedCasesListProps<T>) {
  const [localPage, setLocalPage] = useState(0);
  const [localRowsPerPage, setLocalRowsPerPage] = useState(10);

  // Use local state if not controlled
  const currentPage = onPageChange ? page : localPage;
  const currentRowsPerPage = onRowsPerPageChange ? rowsPerPage : localRowsPerPage;

  // Filter cases based on search query
  const filteredCases = useMemo(() => {
    if (!searchQuery.trim()) return cases;
    
    const query = searchQuery.toLowerCase().trim();
    return cases.filter(case_ => {
      const transformedCase = transformCase(case_);
      const patient = transformedCase.patient;
      
      return (
        patient.name.toLowerCase().includes(query) ||
        patient.id.toLowerCase().includes(query) ||
        patient.nationalId?.toLowerCase().includes(query) ||
        patient.mrn?.toLowerCase().includes(query) ||
        transformedCase.status.toLowerCase().includes(query)
      );
    });
  }, [cases, searchQuery, transformCase]);

  // Paginate cases
  const paginatedCases = useMemo(() => {
    const startIndex = currentPage * currentRowsPerPage;
    return filteredCases.slice(startIndex, startIndex + currentRowsPerPage);
  }, [filteredCases, currentPage, currentRowsPerPage]);

  const handlePageChange = (newPage: number) => {
    if (onPageChange) {
      onPageChange(newPage);
    } else {
      setLocalPage(newPage);
    }
  };

  const handleRowsPerPageChange = (newRowsPerPage: number) => {
    if (onRowsPerPageChange) {
      onRowsPerPageChange(newRowsPerPage);
    } else {
      setLocalRowsPerPage(newRowsPerPage);
    }
    handlePageChange(0);
  };

  const handleSort = (field: string) => {
    if (onSortChange) {
      const newDirection = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
      onSortChange(field, newDirection);
    }
  };

  const renderEmptyState = () => (
    <Box sx={{ textAlign: 'center', py: 8 }}>
      <Typography variant="h6" color="text.secondary" gutterBottom>
        {emptyMessage}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {searchQuery ? 'Try adjusting your search criteria' : 'Create your first case to get started'}
      </Typography>
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={onCreateCase}
      >
        {emptyActionLabel}
      </Button>
    </Box>
  );

  const renderTableView = () => (
    <Paper elevation={0}>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              {tableColumns.map((column) => (
                <TableCell key={column.key}>
                  {column.sortable && onSortChange ? (
                    <TableSortLabel
                      active={sortField === column.key}
                      direction={sortField === column.key ? sortDirection : 'asc'}
                      onClick={() => handleSort(column.key)}
                    >
                      {column.label}
                    </TableSortLabel>
                  ) : (
                    column.label
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={tableColumns.length} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : paginatedCases.length === 0 ? (
              <TableRow>
                <TableCell colSpan={tableColumns.length} align="center">
                  {renderEmptyState()}
                </TableCell>
              </TableRow>
            ) : (
              paginatedCases.map((case_, index) => {
                const transformedCase = transformCase(case_);
                return (
                  <TableRow key={transformedCase.caseId} hover>
                    {tableColumns.map((column) => (
                      <TableCell key={column.key}>
                        {column.render ? column.render(case_) : (
                          <Typography variant="body2">
                            {String((case_ as any)[column.key] || 'N/A')}
                          </Typography>
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
      
      <TablePagination
        rowsPerPageOptions={[5, 10, 25, 50]}
        component="div"
        count={filteredCases.length}
        rowsPerPage={currentRowsPerPage}
        page={currentPage}
        onPageChange={(_, newPage) => handlePageChange(newPage)}
        onRowsPerPageChange={(event) => handleRowsPerPageChange(parseInt(event.target.value, 10))}
      />
    </Paper>
  );

  const renderCardsView = () => (
    <Box>
      {loading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      ) : paginatedCases.length === 0 ? (
        renderEmptyState()
      ) : (
        <Grid container spacing={2}>
          {paginatedCases.map((case_) => {
            const transformedCase = transformCase(case_);
            return (
              <Grid item xs={12} md={6} lg={4} key={transformedCase.caseId}>
                <UnifiedCaseCard {...transformedCase} />
              </Grid>
            );
          })}
        </Grid>
      )}
      
      {/* Pagination for cards view */}
      <Box display="flex" justifyContent="center" mt={3}>
        <TablePagination
          rowsPerPageOptions={[6, 12, 24, 48]}
          component="div"
          count={filteredCases.length}
          rowsPerPage={currentRowsPerPage}
          page={currentPage}
          onPageChange={(_, newPage) => handlePageChange(newPage)}
          onRowsPerPageChange={(event) => handleRowsPerPageChange(parseInt(event.target.value, 10))}
          labelRowsPerPage="Cards per page:"
        />
      </Box>
    </Box>
  );

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body1" color="text.secondary">
              {subtitle}
            </Typography>
          )}
          <Typography variant="body2" color="text.secondary">
            {filteredCases.length} of {cases.length} cases
          </Typography>
        </Box>
        
        <Box display="flex" gap={2} alignItems="center">
          {/* View Mode Toggle */}
          <ToggleButtonGroup
            value={viewMode}
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
          
          {/* Refresh Button */}
          {onRefresh && (
            <Tooltip title="Refresh Data">
              <IconButton onClick={onRefresh}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          )}
          
          {/* Create Button */}
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
          placeholder="Search by name, ID, or national ID..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: searchQuery && (
              <InputAdornment position="end">
                <IconButton onClick={onClearSearch} size="small">
                  <ClearIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => {}}>
          {error}
        </Alert>
      )}

      {/* Content */}
      {viewMode === 'table' ? renderTableView() : renderCardsView()}
    </Box>
  );
}

export default UnifiedCasesList;
