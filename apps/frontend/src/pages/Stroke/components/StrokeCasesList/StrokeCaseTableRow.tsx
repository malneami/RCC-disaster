import React from 'react';
import {
  TableRow,
  TableCell,
  Chip,
  IconButton,
  Tooltip,
  Box,
  Typography,
} from '@mui/material';
import {
  Edit as EditIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon,
  Assignment as OutcomeFormIcon,
  CheckCircle as CheckIcon,
  Cancel as CrossIcon,
} from '@mui/icons-material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock, faUser, faHospital } from '@fortawesome/free-solid-svg-icons';

import { StrokeCase, StrokeService, StrokeStatus } from '../../../../services/strokeService';
import OutcomeFormCompleteness from '../OutcomeFormCompleteness';

interface StrokeCaseTableRowProps {
  strokeCase: StrokeCase;
  onViewDetails: (case_: StrokeCase) => void;
  onEditCase: (case_: StrokeCase) => void;
  onDeleteCase?: (case_: StrokeCase) => void;
  onOpenOutcomeForm?: (case_: StrokeCase) => void;
  isAdmin?: boolean;
}

// Helper function to calculate KPI status
const calculateKpiStatus = (case_: StrokeCase) => {
  const kpis = {
    doorToPhysician: false,
    registrationToCt: false,
    doorToCtReport: false,
    doorToThrombolysisOrder: false,
    doorToNeedle: false,
    registrationToThrombectomy: false,
  };

  // KPI 1: Door to Physician ≤15min
  if (case_.doorToPhysicianMinutes !== null && case_.doorToPhysicianMinutes !== undefined) {
    kpis.doorToPhysician = case_.doorToPhysicianMinutes <= 15;
  }

  // KPI 3: Registration to CT ≤20min
  if (case_.registrationToCtMinutes !== null && case_.registrationToCtMinutes !== undefined) {
    kpis.registrationToCt = case_.registrationToCtMinutes <= 20;
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
  if (case_.registrationToMechanicalThrombectomyMinutes !== null && case_.registrationToMechanicalThrombectomyMinutes !== undefined) {
    kpis.registrationToThrombectomy = case_.registrationToMechanicalThrombectomyMinutes <= 120;
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
  isAdmin = false,
}) => {
  const kpis = calculateKpiStatus(strokeCase);

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
    <TableRow hover>
      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FontAwesomeIcon icon={faUser} style={{ color: '#1976d2', fontSize: '14px' }} />
          <Box>
            <div style={{ fontWeight: 'bold' }}>
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
          met={kpis.registrationToCt} 
          applicable={strokeCase.registrationToCtMinutes !== null && strokeCase.registrationToCtMinutes !== undefined}
          minutes={strokeCase.registrationToCtMinutes}
        />
      </TableCell>
      
      <TableCell>
        <KpiIcon 
          met={kpis.doorToCtReport} 
          applicable={strokeCase.doorToCtReportMinutes !== null && strokeCase.doorToCtReportMinutes !== undefined}
          minutes={strokeCase.doorToCtReportMinutes}
          isInformational={true}
        />
      </TableCell>
      
      <TableCell>
        <KpiIcon 
          met={kpis.doorToThrombolysisOrder} 
          applicable={strokeCase.doorToThrombolysisOrderMinutes !== null && strokeCase.doorToThrombolysisOrderMinutes !== undefined}
          minutes={strokeCase.doorToThrombolysisOrderMinutes}
          isInformational={true}
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
          met={kpis.registrationToThrombectomy} 
          applicable={strokeCase.registrationToMechanicalThrombectomyMinutes !== null && strokeCase.registrationToMechanicalThrombectomyMinutes !== undefined}
          minutes={strokeCase.registrationToMechanicalThrombectomyMinutes}
        />
      </TableCell>
      
      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <OutcomeFormCompleteness strokeCase={strokeCase} />
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
      
      <TableCell>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="View Details">
            <IconButton
              size="small"
              onClick={() => onViewDetails(strokeCase)}
              color="primary"
            >
              <ViewIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit Case">
            <IconButton
              size="small"
              onClick={() => onEditCase(strokeCase)}
              color="secondary"
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {isAdmin && onDeleteCase && (
            <Tooltip title="Delete Case (Admin Only)">
              <IconButton
                size="small"
                onClick={() => onDeleteCase(strokeCase)}
                color="error"
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </TableCell>
    </TableRow>
  );
};

export default StrokeCaseTableRow;
