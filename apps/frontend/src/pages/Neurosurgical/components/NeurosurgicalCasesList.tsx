import React, { useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Card,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Cancel as CrossIcon,
  MoreVert as MoreVertIcon,
  Visibility as ViewIcon,
  Assignment as OutcomeFormIcon,
} from '@mui/icons-material';
import {
  NeurosurgicalCase,
  NeurosurgicalCaseStatus,
  NeurosurgicalSeverity,
} from '../../../services/neurosurgicalService';
import { NEURO_CONFIG, getNeuroCtTargets } from '../config/neuroConfig';
import NeurosurgicalCaseCompleteness from './NeurosurgicalCaseCompleteness';

interface NeurosurgicalCasesListProps {
  cases: NeurosurgicalCase[];
  onOpen: (id: string) => void;
  onOpenOutcome: (case_: NeurosurgicalCase) => void;
}

const KpiIcon: React.FC<{
  met: boolean | null | undefined;
  minutes?: number | null;
}> = ({ met, minutes }) => {
  if (minutes === null || minutes === undefined) {
    return (
      <Typography variant="caption" color="text.secondary">
        -
      </Typography>
    );
  }
  return (
    <Box display="flex" alignItems="center" gap={0.5} justifyContent="center">
      {met ? (
        <CheckIcon color="success" fontSize="small" />
      ) : (
        <CrossIcon color="error" fontSize="small" />
      )}
      <Typography variant="caption" color="text.secondary">
        {minutes}m
      </Typography>
    </Box>
  );
};

const statusColor = (
  status: NeurosurgicalCaseStatus,
): 'default' | 'info' | 'success' | 'warning' | 'error' => {
  switch (status) {
    case 'ACTIVE':
      return 'warning';
    case 'DEFINITIVE_CARE_REACHED':
      return 'info';
    case 'CLOSED':
      return 'success';
    default:
      return 'default';
  }
};

const severityColor = (s: NeurosurgicalSeverity): 'error' | 'warning' =>
  s === 'RED' ? 'error' : 'warning';

const formatAdmissionTime = (case_: NeurosurgicalCase): string => {
  const raw = case_.doorTime || case_.activatedAt;
  if (!raw) return 'N/A';
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatPatientName = (patient: NeurosurgicalCase['patient']) => {
  if (!patient) return 'Unknown Patient';
  return `${patient.firstName} ${patient.lastName}`;
};

const NeurosurgicalCasesList: React.FC<NeurosurgicalCasesListProps> = ({
  cases,
  onOpen,
  onOpenOutcome,
}) => {
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [menuCase, setMenuCase] = useState<NeurosurgicalCase | null>(null);

  if (cases.length === 0) {
    return (
      <Alert severity="info">
        No neurosurgical pathway cases yet. Activate from a ticket (pathway
        NEUROSURGICAL or Activate Neurosurgical Pathway button).
      </Alert>
    );
  }

  const handleMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    case_: NeurosurgicalCase,
  ) => {
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
    setMenuCase(case_);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setMenuCase(null);
  };

  return (
    <Card elevation={0}>
      <TableContainer component={Paper} elevation={0}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Patient</TableCell>
              <TableCell>Admission Time</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Severity</TableCell>
              <TableCell>Origin Hospital</TableCell>
              <TableCell>Destination Hospital</TableCell>
              <TableCell align="center">
                <Tooltip title="CT at origin ≤15 min; transfer to destination CT ≤30 min. N/A until CT location set.">
                  <Typography variant="caption" fontWeight="bold">
                    Door→CT
                  </Typography>
                </Tooltip>
              </TableCell>
              <TableCell align="center">
                <Tooltip title="CT at origin ≤30 min; transfer ≤35 min. N/A until CT location set.">
                  <Typography variant="caption" fontWeight="bold">
                    CT Report
                  </Typography>
                </Tooltip>
              </TableCell>
              <TableCell align="center">
                <Tooltip
                  title={`Activation (call RCC) → Neurosurgeon decision ≤${NEURO_CONFIG.KPI_TARGETS.RCC_TO_NEUROSURGEON_DECISION} min`}
                >
                  <Typography variant="caption" fontWeight="bold">
                    RCC→Decision
                  </Typography>
                </Tooltip>
              </TableCell>
              <TableCell align="center">
                <Tooltip
                  title={`Door out (origin) → Definitive care (destination) ≤${NEURO_CONFIG.KPI_TARGETS.DOOR_OUT_TO_DEFINITIVE_CARE} min`}
                >
                  <Typography variant="caption" fontWeight="bold">
                    DoorOut→Def
                  </Typography>
                </Tooltip>
              </TableCell>
              <TableCell>Completeness</TableCell>
              <TableCell align="right">Outcome</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {cases.map((c) => (
              <TableRow key={c.id} hover>
                <TableCell>
                  <Box
                    display="flex"
                    alignItems="center"
                    gap={1}
                    justifyContent="space-between"
                  >
                    <Box display="flex" alignItems="center" gap={2} flex={1}>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        {c.patient?.firstName?.[0] || 'P'}
                      </Avatar>
                      <Box>
                        <Typography
                          variant="subtitle2"
                          sx={{ color: '#1976d2', cursor: 'pointer' }}
                          onClick={() => onOpen(c.id)}
                        >
                          {formatPatientName(c.patient)}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          fontFamily="monospace"
                        >
                          {c.patient?.nationalId || c.patient?.mrn || 'N/A'}
                        </Typography>
                      </Box>
                    </Box>
                    <IconButton size="small" onClick={(e) => handleMenuOpen(e, c)}>
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{formatAdmissionTime(c)}</Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={c.status.replace(/_/g, ' ')}
                    color={statusColor(c.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={c.severity}
                    color={severityColor(c.severity)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {c.originHospital?.name || 'N/A'}
                  </Typography>
                  {c.originHospital?.cluster && (
                    <Typography variant="caption" color="text.secondary">
                      {c.originHospital.cluster}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {c.destinationHospital?.name || 'N/A'}
                  </Typography>
                  {c.destinationHospital?.cluster && (
                    <Typography variant="caption" color="text.secondary">
                      {c.destinationHospital.cluster}
                    </Typography>
                  )}
                </TableCell>
                <TableCell align="center">
                  <KpiIcon
                    met={c.metKpi1}
                    minutes={
                      getNeuroCtTargets(c.ctLocation) ? c.doorToCtMinutes : null
                    }
                  />
                </TableCell>
                <TableCell align="center">
                  <KpiIcon
                    met={c.metKpi2}
                    minutes={
                      getNeuroCtTargets(c.ctLocation) ? c.doorToCtReportMinutes : null
                    }
                  />
                </TableCell>
                <TableCell align="center">
                  <KpiIcon met={c.metKpi3} minutes={c.activationToNeurosurgeonMinutes} />
                </TableCell>
                <TableCell align="center">
                  <KpiIcon
                    met={c.metKpi4}
                    minutes={
                      c.doorOutToDefinitiveCareMinutes ??
                      c.activationToDefinitiveCareMinutes
                    }
                  />
                </TableCell>
                <TableCell>
                  <NeurosurgicalCaseCompleteness neuroCase={c} />
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="Open Outcome & Disposition form">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => onOpenOutcome(c)}
                    >
                      <OutcomeFormIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem
          onClick={() => {
            if (menuCase) onOpen(menuCase.id);
            handleMenuClose();
          }}
          disabled={!menuCase}
        >
          <ViewIcon fontSize="small" sx={{ mr: 1 }} />
          Open case
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (menuCase) onOpenOutcome(menuCase);
            handleMenuClose();
          }}
          disabled={!menuCase}
        >
          <OutcomeFormIcon fontSize="small" sx={{ mr: 1 }} />
          Outcome form
        </MenuItem>
      </Menu>
    </Card>
  );
};

export default NeurosurgicalCasesList;
