import React, { useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  IconButton,
  Chip,
  Typography,
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
  Menu,
  MenuItem,
  TablePagination,
} from '@mui/material';
import {
  Edit as EditIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon,
  Assignment as OutcomeFormIcon,
  CheckCircle as CheckIcon,
  Cancel as CrossIcon,
  MoreVert as MoreVertIcon,
  Comment as CommentIcon,
} from '@mui/icons-material';
import { StemiCase } from '../services/stemiService';
import StemiOutcomeForm from './StemiOutcomeForm';
import StemiCaseCompleteness from './StemiCaseCompleteness';
import CaseNoteModal from '../../../pages/NotificationCenter/components/CaseNoteModal';
import { notificationService } from '../../../services/notificationService';

interface StemiCasesListProps {
  cases: StemiCase[];
  loading: boolean;
  onEditCase: (case_: StemiCase) => void;
  onViewCase: (case_: StemiCase) => void;
  onDeleteCase: (id: string) => void;
  onOutcomeFormUpdate?: (caseId: string, updatedData: any) => void;
  onAddCaseNote?: (case_: StemiCase) => void;
  totalCount: number;
  page: number;
  rowsPerPage: number;
  onPageChange: (event: unknown, newPage: number) => void;
  onRowsPerPageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

// Helper functions to calculate KPI status
const calculateKpiStatus = (case_: StemiCase) => {
  const kpis = {
    doorToEcg: false,
    doorToBalloon: false,
    doorToNeedle: false,
    rccActivation: false,
    doorInDoorOut: false,
  };

  // KPI 1: Door to ECG ≤10 min
  if (case_.doorToEcgMinutes !== null && case_.doorToEcgMinutes !== undefined) {
    kpis.doorToEcg = case_.doorToEcgMinutes <= 10;
  }

  // KPI 2: Door to Balloon - Direct ≤90min, Transfer ≤120min
  if (case_.doorToBalloonMinutes !== null && case_.doorToBalloonMinutes !== undefined) {
    const target = case_.caseType === 'TRANSFER' ? 120 : 90;
    kpis.doorToBalloon = case_.doorToBalloonMinutes <= target;
  }

  // KPI 3: Door to Needle ≤30min (Only for thrombolytic cases)
  if (case_.thrombolyticGiven && case_.doorToNeedleMinutes !== null && case_.doorToNeedleMinutes !== undefined) {
    kpis.doorToNeedle = case_.doorToNeedleMinutes <= 30;
  }

  // KPI 4: RCC Activation ≤15min (Transfer cases only)
  if (case_.caseType === 'TRANSFER' && case_.rccActivationToDoorOutMinutes !== null && case_.rccActivationToDoorOutMinutes !== undefined) {
    kpis.rccActivation = case_.rccActivationToDoorOutMinutes <= 15;
  }

  // KPI 5: Door In Door Out ≤30min (Transfer cases only)
  if (case_.caseType === 'TRANSFER' && case_.doorInDoorOutMinutes !== null && case_.doorInDoorOutMinutes !== undefined) {
    kpis.doorInDoorOut = case_.doorInDoorOutMinutes <= 30;
  }

  return kpis;
};

const KpiIcon: React.FC<{ met: boolean; applicable: boolean; minutes?: number | null }> = ({ met, applicable, minutes }) => {
  if (!applicable) {
    return <Typography variant="caption" color="textSecondary">-</Typography>;
  }
  
  return (
    <Box display="flex" alignItems="center" gap={0.5}>
      {met ? (
        <CheckIcon color="success" fontSize="small" />
      ) : (
        <CrossIcon color="error" fontSize="small" />
      )}
      <Typography variant="caption" color="textSecondary">
        {minutes !== null && minutes !== undefined ? `${minutes}m` : 'N/A'}
      </Typography>
    </Box>
  );
};

const StemiCasesList: React.FC<StemiCasesListProps> = ({
  cases,
  loading,
  onEditCase,
  onViewCase,
  onDeleteCase,
  onOutcomeFormUpdate,
  onAddCaseNote,
  totalCount,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
}) => {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState<StemiCase | null>(null);
  const [outcomeFormDialogOpen, setOutcomeFormDialogOpen] = useState(false);
  const [outcomeFormCaseId, setOutcomeFormCaseId] = useState<string | null>(null);
  const [showCaseNoteModal, setShowCaseNoteModal] = useState(false);
  const [selectedCaseForNote, setSelectedCaseForNote] = useState<StemiCase | null>(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedCaseForMenu, setSelectedCaseForMenu] = useState<StemiCase | null>(null);
  const [sortConfig, setSortConfig] = useState<{
    field: keyof StemiCase | 'patient';
    direction: 'asc' | 'desc';
  }>({ field: 'createdAt', direction: 'desc' });

  // Client-side sorting only (filtering is now server-side)
  const sortedCases = useMemo(() => {
    const sorted = [...cases].sort((a, b) => {
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

    return sorted;
  }, [cases, sortConfig]);


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

  const handleOpenOutcomeForm = (case_: StemiCase) => {
    setSelectedCase(case_); // Set the selected case for the outcome form
    setOutcomeFormCaseId(case_.id);
    setOutcomeFormDialogOpen(true);
  };

  const handleOutcomeFormClose = () => {
    setOutcomeFormDialogOpen(false);
    setOutcomeFormCaseId(null);
  };

  const handleOutcomeFormSuccess = (updatedData?: any) => {
    // Call the parent callback to update the cases list
    if (outcomeFormCaseId && onOutcomeFormUpdate) {
      onOutcomeFormUpdate(outcomeFormCaseId, updatedData);
    }
  };

  const handleSort = (field: keyof StemiCase | 'patient') => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, case_: StemiCase) => {
    setMenuAnchorEl(event.currentTarget);
    setSelectedCaseForMenu(case_);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedCaseForMenu(null);
  };

  const handleViewDetails = () => {
    if (selectedCaseForMenu) {
      onViewCase(selectedCaseForMenu);
    }
    handleMenuClose();
  };

  const handleEditCase = () => {
    if (selectedCaseForMenu) {
      onEditCase(selectedCaseForMenu);
    }
    handleMenuClose();
  };

  const handleDeleteCase = () => {
    if (selectedCaseForMenu) {
      handleDeleteClick(selectedCaseForMenu);
    }
    handleMenuClose();
  };

  const handleAddCaseNote = () => {
    if (selectedCaseForMenu) {
      setSelectedCaseForNote(selectedCaseForMenu);
      setShowCaseNoteModal(true);
    }
    handleMenuClose();
  };

  const handleCaseNoteSubmit = async (data: any) => {
    try {
      await notificationService.createCaseNote(data);
      setShowCaseNoteModal(false);
      setSelectedCaseForNote(null);
      // Optionally refresh data or show success message
    } catch (error) {
      console.error('Failed to create case note:', error);
      // Handle error - could show a toast notification
    }
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

  const formatDate = (dateString?: string | null) => {
    if (!dateString) {
      return 'N/A';
    }

    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) {
      return 'N/A';
    }

    return date.toLocaleDateString('en-US', {
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
                <TableCell align="center">
                  <Tooltip title="Door to ECG ≤10 min">
                    <Typography variant="caption" fontWeight="bold">
                      Door to ECG
                    </Typography>
                  </Tooltip>
                </TableCell>
                <TableCell align="center">
                  <Tooltip title="Door to Balloon: Direct ≤90min, Transfer ≤120min">
                    <Typography variant="caption" fontWeight="bold">
                      Door to Balloon
                    </Typography>
                  </Tooltip>
                </TableCell>
                <TableCell align="center">
                  <Tooltip title="Door to Needle ≤30 min (Thrombolytic cases only)">
                    <Typography variant="caption" fontWeight="bold">
                      Door to Needle
                    </Typography>
                  </Tooltip>
                </TableCell>
                <TableCell align="center">
                  <Tooltip title="RCC Activation ≤15 min (Transfer cases only)">
                    <Typography variant="caption" fontWeight="bold">
                      RCC Activation
                    </Typography>
                  </Tooltip>
                </TableCell>
                <TableCell align="center">
                  <Tooltip title="Door In Door Out ≤30 min (Transfer cases only)">
                    <Typography variant="caption" fontWeight="bold">
                      Door In Door Out
                    </Typography>
                  </Tooltip>
                </TableCell>
                <TableCell>Completeness</TableCell>
                <TableCell align="right">Outcome</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={12} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : cases.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={12} align="center">
                    <Alert severity="info">No STEMI cases found</Alert>
                  </TableCell>
                </TableRow>
              ) : (
                sortedCases.map((case_) => {
                  const kpis = calculateKpiStatus(case_);
                  return (
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
                              <Typography variant="subtitle2" sx={{ color: '#1976d2', cursor: 'pointer' }} onClick={() => onViewCase(case_)}>
                                {formatPatientName(case_.patient)}
                              </Typography>
                              <Typography variant="caption" color="textSecondary" fontFamily="monospace">
                                {case_.patient?.nationalId ? formatNationalId(case_.patient.nationalId) : 'N/A'}
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
                        <Typography variant="body2">
                          {formatDate(case_.pathwayStarted)}
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
                      <TableCell align="center">
                        <KpiIcon 
                          met={kpis.doorToEcg} 
                          applicable={case_.doorToEcgMinutes !== null && case_.doorToEcgMinutes !== undefined}
                          minutes={case_.doorToEcgMinutes}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <KpiIcon 
                          met={kpis.doorToBalloon} 
                          applicable={case_.doorToBalloonMinutes !== null && case_.doorToBalloonMinutes !== undefined}
                          minutes={case_.doorToBalloonMinutes}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <KpiIcon 
                          met={kpis.doorToNeedle} 
                          applicable={!!(case_.thrombolyticGiven && case_.doorToNeedleMinutes !== null && case_.doorToNeedleMinutes !== undefined)}
                          minutes={case_.doorToNeedleMinutes}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <KpiIcon 
                          met={kpis.rccActivation} 
                          applicable={case_.caseType === 'TRANSFER' && case_.rccActivationToDoorOutMinutes !== null && case_.rccActivationToDoorOutMinutes !== undefined}
                          minutes={case_.rccActivationToDoorOutMinutes}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <KpiIcon 
                          met={kpis.doorInDoorOut} 
                          applicable={case_.caseType === 'TRANSFER' && case_.doorInDoorOutMinutes !== null && case_.doorInDoorOutMinutes !== undefined}
                          minutes={case_.doorInDoorOutMinutes}
                        />
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <StemiCaseCompleteness stemiCase={case_ as any} />
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Box display="flex" gap={1} justifyContent="flex-end">
                          <Tooltip title="Open Outcome Form">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenOutcomeForm(case_)}
                              color="primary"
                            >
                              <OutcomeFormIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[10, 20, 50]}
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
        <MenuItem onClick={handleViewDetails}>
          <ViewIcon fontSize="small" sx={{ mr: 1 }} />
          View Details
        </MenuItem>
        {onAddCaseNote && (
          <MenuItem onClick={handleAddCaseNote}>
            <CommentIcon fontSize="small" sx={{ mr: 1 }} />
            Add Case Note
          </MenuItem>
        )}
        <MenuItem onClick={handleEditCase}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Edit Case
        </MenuItem>
        <MenuItem onClick={handleDeleteCase} sx={{ color: 'error.main' }}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Delete Case
        </MenuItem>
      </Menu>

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


      {/* Outcome Form Dialog */}
      {outcomeFormCaseId && (
        <StemiOutcomeForm
          open={outcomeFormDialogOpen}
          onClose={handleOutcomeFormClose}
          stemiCaseId={outcomeFormCaseId}
          stemiCaseData={selectedCase}
          onSuccess={handleOutcomeFormSuccess}
        />
      )}

      {/* Case Note Modal */}
      <CaseNoteModal
        open={showCaseNoteModal}
        onClose={() => {
          setShowCaseNoteModal(false);
          setSelectedCaseForNote(null);
        }}
        onSubmit={handleCaseNoteSubmit}
        patientName={selectedCaseForNote ? `${selectedCaseForNote.patient?.firstName || ''} ${selectedCaseForNote.patient?.lastName || ''}`.trim() : ''}
        caseType="STEMI"
        caseId={selectedCaseForNote?.id || ''}
        patientId={selectedCaseForNote?.patientId || ''}
        ticketId={selectedCaseForNote?.ticketId}
      />
    </Box>
  );
};

export default StemiCasesList;
