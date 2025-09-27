import React, { useState } from 'react';
import {
  TableRow,
  TableCell,
  Chip,
  IconButton,
  Tooltip,
  Box,
  Typography,
  Menu,
  MenuItem,
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
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock, faUser, faHospital } from '@fortawesome/free-solid-svg-icons';

import { StrokeCase, StrokeService, StrokeStatus } from '../../../../services/strokeService';
import StrokeCaseCompleteness from '../StrokeCaseCompleteness';
import CaseNoteModal from '../../../../pages/NotificationCenter/components/CaseNoteModal';
import { notificationService } from '../../../../services/notificationService';

interface StrokeCaseTableRowProps {
  strokeCase: StrokeCase;
  onViewDetails: (case_: StrokeCase) => void;
  onEditCase: (case_: StrokeCase) => void;
  onDeleteCase?: (case_: StrokeCase) => void;
  onOpenOutcomeForm?: (case_: StrokeCase) => void;
  onAddCaseNote?: (case_: StrokeCase) => void;
  isAdmin?: boolean;
}

// Helper function to calculate KPI status
const calculateKpiStatus = (case_: StrokeCase) => {
  const kpis = {
    doorToPhysician: false,
    doorToCtScan: false,
    doorToCtReport: false,
    doorToThrombolysisOrder: false,
    doorToNeedle: false,
    doorToMechanicalThrombectomy: false,
  };

  // KPI 1: Door to Physician ≤15min
  if (case_.doorToPhysicianMinutes !== null && case_.doorToPhysicianMinutes !== undefined) {
    kpis.doorToPhysician = case_.doorToPhysicianMinutes <= 15;
  }

  // KPI 3: Registration to CT ≤20min
  if (case_.doorToCtScanMinutes !== null && case_.doorToCtScanMinutes !== undefined) {
    kpis.doorToCtScan = case_.doorToCtScanMinutes <= 20;
  }

  // Door to CT Report (no specific KPI target, but we can show the time)
  if (case_.doorToCtReportMinutes !== null && case_.doorToCtReportMinutes !== undefined) {
    kpis.doorToCtReport = true; // Always met if time is recorded (informational only)
  }

  // Door to Thrombolysis Order (no specific KPI target, but we can show the time)
  if (case_.doorToThrombolysisOrderMinutes !== null && case_.doorToThrombolysisOrderMinutes !== undefined) {
    kpis.doorToThrombolysisOrder = true; // Always met if time is recorded (informational only)
  }

  // KPI 4: Registration to IV Thrombolysis ≤60min
  if (case_.registrationToThrombolysisMinutes !== null && case_.registrationToThrombolysisMinutes !== undefined) {
    kpis.doorToNeedle = case_.registrationToThrombolysisMinutes <= 60;
  }

  // KPI 8: Registration to Mechanical Thrombectomy Puncture ≤120min
  if (case_.doorToMechanicalThrombectomyMinutes !== null && case_.doorToMechanicalThrombectomyMinutes !== undefined) {
    kpis.doorToMechanicalThrombectomy = case_.doorToMechanicalThrombectomyMinutes <= 120;
  }

  return kpis;
};

const KpiIcon: React.FC<{ met: boolean; applicable: boolean; minutes?: number | null; isInformational?: boolean }> = ({ met, applicable, minutes, isInformational = false }) => {
  if (!applicable) {
    return <Typography variant="caption" color="textSecondary">-</Typography>;
  }
  
  return (
    <Box display="flex" alignItems="center" gap={0.5}>
      {isInformational ? (
        <Typography variant="caption" color="textSecondary">⏱</Typography>
      ) : met ? (
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

const StrokeCaseTableRow: React.FC<StrokeCaseTableRowProps> = ({
  strokeCase,
  onViewDetails,
  onEditCase,
  onDeleteCase,
  onOpenOutcomeForm,
  onAddCaseNote,
  isAdmin = false,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const [showCaseNoteModal, setShowCaseNoteModal] = useState(false);
  const kpis = calculateKpiStatus(strokeCase);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleViewDetails = () => {
    onViewDetails(strokeCase);
    handleMenuClose();
  };

  const handleEditCase = () => {
    onEditCase(strokeCase);
    handleMenuClose();
  };

  const handleDeleteCase = () => {
    if (onDeleteCase) {
      onDeleteCase(strokeCase);
    }
    handleMenuClose();
  };

  const handleAddCaseNote = () => {
    setShowCaseNoteModal(true);
    handleMenuClose();
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

  const getStatusColor = (status: StrokeStatus): string => {
    const colors: Record<StrokeStatus, string> = {
      SUSPECTED: 'default',
      CONFIRMED: 'primary',
      IMAGING_PENDING: 'warning',
      IMAGING_COMPLETE: 'info',
      TREATMENT_EVALUATION: 'warning',
      THROMBOLYSIS_STARTED: 'secondary',
      THROMBECTOMY_STARTED: 'secondary',
      TREATMENT_COMPLETE: 'success',
      STROKEUNIT_ADMITTED: 'info',
      REHABILITATION_STARTED: 'info',
      DISCHARGED: 'success',
      FOLLOW_UP: 'default',
    };
    return colors[status] || 'default';
  };


  const formatDateTime = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  return (
    <>
      <TableRow hover>
      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer', flex: 1 }} onClick={handleViewDetails}>
            <FontAwesomeIcon icon={faUser} style={{ color: '#1976d2', fontSize: '14px' }} />
            <Box>
              <div style={{ fontWeight: 'bold', color: '#1976d2' }}>
                {strokeCase.patient?.firstName} {strokeCase.patient?.lastName}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#666' }}>
                National ID: {strokeCase.patient?.nationalId || 'Not set'}
                {strokeCase.patient?.mrn && (
                  <span style={{ marginLeft: '12px' }}>
                    MRN: {strokeCase.patient.mrn}
                  </span>
                )}
              </div>
            </Box>
          </Box>
          <IconButton
            size="small"
            onClick={handleMenuClick}
            sx={{ ml: 1 }}
          >
            <MoreVertIcon fontSize="small" />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={open}
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
            {isAdmin && onDeleteCase && (
              <MenuItem onClick={handleDeleteCase} sx={{ color: 'error.main' }}>
                <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
                Delete Case
              </MenuItem>
            )}
          </Menu>
        </Box>
      </TableCell>
      
      <TableCell>
        <Chip
          label={StrokeService.getStrokeTypeLabel(strokeCase.strokeType)}
          size="small"
          color="primary"
          variant="outlined"
        />
      </TableCell>
      
      
      <TableCell>
        <Chip
          label={StrokeService.getStrokeStatusLabel(strokeCase.currentStatus)}
          size="small"
          color={getStatusColor(strokeCase.currentStatus) as any}
        />
      </TableCell>
      
      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FontAwesomeIcon icon={faHospital} style={{ color: '#1976d2', fontSize: '14px' }} />
          {strokeCase.originHospital?.name || 'N/A'}
        </Box>
      </TableCell>
      
      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FontAwesomeIcon icon={faClock} style={{ color: '#1976d2', fontSize: '14px' }} />
          {formatDateTime(strokeCase.createdAt)}
        </Box>
      </TableCell>
      
      <TableCell>
        <KpiIcon 
          met={kpis.doorToPhysician} 
          applicable={strokeCase.doorToPhysicianMinutes !== null && strokeCase.doorToPhysicianMinutes !== undefined}
          minutes={strokeCase.doorToPhysicianMinutes}
        />
      </TableCell>
      
      <TableCell>
        <KpiIcon 
          met={kpis.doorToCtScan} 
          applicable={strokeCase.doorToCtScanMinutes !== null && strokeCase.doorToCtScanMinutes !== undefined}
          minutes={strokeCase.doorToCtScanMinutes}
        />
      </TableCell>
      
      <TableCell>
        <KpiIcon 
          met={kpis.doorToCtReport} 
          applicable={strokeCase.doorToCtReportMinutes !== null && strokeCase.doorToCtReportMinutes !== undefined}
          minutes={strokeCase.doorToCtReportMinutes}
        />
      </TableCell>
      
      <TableCell>
        <KpiIcon 
          met={kpis.doorToThrombolysisOrder} 
          applicable={strokeCase.doorToThrombolysisOrderMinutes !== null && strokeCase.doorToThrombolysisOrderMinutes !== undefined}
          minutes={strokeCase.doorToThrombolysisOrderMinutes}
        />
      </TableCell>
      
      <TableCell>
        <KpiIcon 
          met={kpis.doorToNeedle} 
          applicable={strokeCase.registrationToThrombolysisMinutes !== null && strokeCase.registrationToThrombolysisMinutes !== undefined}
          minutes={strokeCase.registrationToThrombolysisMinutes}
        />
      </TableCell>
      
      <TableCell>
        <KpiIcon 
          met={kpis.doorToMechanicalThrombectomy} 
          applicable={strokeCase.doorToMechanicalThrombectomyMinutes !== null && strokeCase.doorToMechanicalThrombectomyMinutes !== undefined}
          minutes={strokeCase.doorToMechanicalThrombectomyMinutes}
        />
      </TableCell>
      
      <TableCell>
        <StrokeCaseCompleteness strokeCase={strokeCase} />
      </TableCell>
      
      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {onOpenOutcomeForm && (
            <Tooltip title="Open Outcome Form">
              <IconButton
                size="small"
                onClick={() => onOpenOutcomeForm(strokeCase)}
                color="primary"
              >
                <OutcomeFormIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </TableCell>
    </TableRow>

    {/* Case Note Modal */}
    <CaseNoteModal
      open={showCaseNoteModal}
      onClose={() => setShowCaseNoteModal(false)}
      onSubmit={handleCaseNoteSubmit}
      patientName={`${strokeCase.patient?.firstName || ''} ${strokeCase.patient?.lastName || ''}`.trim()}
      caseType="STROKE"
      caseId={strokeCase.id}
      patientId={strokeCase.patientId}
      ticketId={strokeCase.ticketId}
    />
  </>
  );
};

export default StrokeCaseTableRow;
