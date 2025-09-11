import React from 'react';
import {
  TableRow,
  TableCell,
  Chip,
  IconButton,
  Tooltip,
  Box,
} from '@mui/material';
import {
  Edit as EditIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon,
  Assignment as OutcomeFormIcon,
} from '@mui/icons-material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock, faUser, faHospital } from '@fortawesome/free-solid-svg-icons';

import { StrokeCase, StrokeService, StrokeStatus, StrokeSeverity } from '../../../../services/strokeService';
import OutcomeFormCompleteness from '../OutcomeFormCompleteness';

interface StrokeCaseTableRowProps {
  strokeCase: StrokeCase;
  onViewDetails: (case_: StrokeCase) => void;
  onEditCase: (case_: StrokeCase) => void;
  onDeleteCase?: (case_: StrokeCase) => void;
  onOpenOutcomeForm?: (case_: StrokeCase) => void;
  isAdmin?: boolean;
}

const StrokeCaseTableRow: React.FC<StrokeCaseTableRowProps> = ({
  strokeCase,
  onViewDetails,
  onEditCase,
  onDeleteCase,
  onOpenOutcomeForm,
  isAdmin = false,
}) => {
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

  const getSeverityColor = (severity?: StrokeSeverity): string => {
    if (!severity) return 'default';
    const colors: Record<StrokeSeverity, string> = {
      MILD: 'success',
      MODERATE: 'warning',
      SEVERE: 'error',
      CRITICAL: 'error',
    };
    return colors[severity] || 'default';
  };

  const formatDateTime = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const formatDuration = (minutes?: number): string => {
    if (!minutes) return 'N/A';
    return StrokeService.formatDuration(minutes);
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
        {strokeCase.strokeSeverity ? (
          <Chip
            label={StrokeService.getStrokeSeverityLabel(strokeCase.strokeSeverity)}
            size="small"
            color={getSeverityColor(strokeCase.strokeSeverity) as any}
            variant="outlined"
          />
        ) : (
          'N/A'
        )}
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
        {strokeCase.nihssBaseline || 'N/A'}
      </TableCell>
      
      <TableCell>
        {formatDuration(strokeCase.doorToNeedleMinutes)}
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
