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
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Delete,
  Visibility,
  Person,
  LocalHospital,
  Warning,
  TransferWithinAStation,
  Edit,
  MoreVert as MoreVertIcon,
  Comment as CommentIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';

import { TraumaCase, TraumaService } from '../../../services/traumaService';
import EditTraumaCaseDialog from './EditTraumaCaseDialog';
import ViewTraumaCaseDialog from './ViewTraumaCaseDialog';
import CaseNoteModal from '../../../pages/NotificationCenter/components/CaseNoteModal';
import { notificationService } from '../../../services/notificationService';

interface TraumaCasesListProps {
  cases: TraumaCase[];
  totalCount: number;
  page: number;
  rowsPerPage: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rowsPerPage: number) => void;
  onCreateCase: () => void;
  onDeleteCase: (id: string) => Promise<void>;
  onUpdateCase: (id: string, data: any) => Promise<void>;
  onAddCaseNote?: (case_: TraumaCase) => void;
  isAdmin: boolean;
  loading?: boolean;
}


export interface TraumaCaseFilters {
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
  totalCount,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  onDeleteCase,
  onUpdateCase,
  onAddCaseNote,
  isAdmin,
  loading = false,
}) => {
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: 'createdAt',
    direction: 'desc',
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState<TraumaCase | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedCaseForMenu, setSelectedCaseForMenu] = useState<TraumaCase | null>(null);
  const [showCaseNoteModal, setShowCaseNoteModal] = useState(false);

  // Only sort cases (filtering is done on backend)
  const sortedCases = useMemo(() => {
    const sorted = [...cases].sort((a, b) => {
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

      // Handle string dates
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const aDate = new Date(aValue);
        const bDate = new Date(bValue);
        if (!isNaN(aDate.getTime()) && !isNaN(bDate.getTime())) {
          return sortConfig.direction === 'asc'
            ? aDate.getTime() - bDate.getTime()
            : bDate.getTime() - aDate.getTime();
        }
      }

      return 0;
    });

    return sorted;
  }, [cases, sortConfig]);

  const handleSort = (field: keyof TraumaCase) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    onPageChange(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    onRowsPerPageChange(newRowsPerPage);
    onPageChange(0);
  };


  const handleViewDetails = (case_: TraumaCase) => {
    setSelectedCase(case_);
    setViewDialogOpen(true);
  };

  const [deleting, setDeleting] = useState(false);

  const handleEditCase = async (case_: TraumaCase) => {
    try {
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
    }
  };

  const handleUpdateCase = async (id: string, data: any) => {
    try {
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
    }
  };

  const handleDeleteClick = (case_: TraumaCase) => {
    setSelectedCase(case_);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedCase) return;

    try {
      setDeleting(true);
      setError(null);
      await onDeleteCase(selectedCase.id);
      setDeleteDialogOpen(false);
    } catch (err) {
      setError('Failed to delete trauma case');
      console.error('Error deleting trauma case:', err);
    } finally {
      setDeleting(false);
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



  if (loading && cases.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>

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
                <TableCell>Door to Transfer</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Hospital</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedCases.map((case_) => (
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
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography
                        variant="body2"
                        sx={{
                          color: TraumaService.getDoorToTransferTimeColor(case_),
                          fontWeight: 'medium'
                        }}
                      >
                        {TraumaService.calculateDoorToTransferTime(case_)}
                      </Typography>
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[5, 10, 15, 20, 50]}
          component="div"
          count={totalCount}
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
            disabled={deleting || loading}
          >
            {deleting ? <CircularProgress size={20} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Filter Dialog */}

      {/* Edit Dialog */}
      <EditTraumaCaseDialog
        key={selectedCase?.id}
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
