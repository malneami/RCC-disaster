import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Grid,
  Chip,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
} from '@mui/material';
import { MeetingRoom, PlayArrow, Stop, TrendingUp, Refresh } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useAuth } from '../../../../contexts/AuthContext';
import {
  disasterService,
  CommandRoom,
  DisasterIncident,
  EscalationLevel,
  getIncidentTypeLabel,
} from '../../../../services/disasterService';
import { CommandRolePanel } from './CommandRolePanel';
import { CommandDecisionLog } from './CommandDecisionLog';
import { CommandCapacityPanel } from './CommandCapacityPanel';
import { CommandDeploymentSummary } from './CommandDeploymentSummary';
import { CommandIncidentStatusPanel } from './CommandIncidentStatusPanel';
import { CommandEMSPanel } from './CommandEMSPanel';
import { CommandHospitalCapacityPanel } from './CommandHospitalCapacityPanel';
import { CommandLiveKPIsPanel } from './CommandLiveKPIsPanel';
import { CommandEscalationTriggersPanel } from './CommandEscalationTriggersPanel';
import { CommandOperationalActionLog } from './CommandOperationalActionLog';
import { CommandRoomVideoPanel } from './CommandRoomVideoPanel';
import { useSituationalAwareness } from '../../hooks/useSituationalAwareness';
import { useOperationalActions } from '../../hooks/useOperationalActions';
import { getTheme } from '../../../../components/Common/KPI/kpiStyles';

const ESCALATION_LABELS: Record<EscalationLevel, string> = {
  LEVEL_1: 'Level 1 – Localized',
  LEVEL_2: 'Level 2 – Multi-Hospital',
  LEVEL_3: 'Level 3 – Regional Disaster',
};

function isCommandRoom(value: unknown): value is CommandRoom {
  return !!value && typeof value === 'object' && !Array.isArray(value) && !!(value as CommandRoom).id;
}

interface DisasterCommandRoomDashboardProps {
  incidents: DisasterIncident[];
  onRefresh: () => void;
  socketRef?: React.RefObject<Socket | null>;
}

declare type Socket = import('socket.io-client').Socket;

export const DisasterCommandRoomDashboard: React.FC<DisasterCommandRoomDashboardProps> = ({
  incidents,
  onRefresh,
  socketRef,
}) => {
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const theme = getTheme('disaster');
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [commandRoom, setCommandRoom] = useState<CommandRoom | null | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [activating, setActivating] = useState(false);
  const [closing, setClosing] = useState(false);
  const [escalating, setEscalating] = useState(false);
  const [closeConfirmOpen, setCloseConfirmOpen] = useState(false);

  const selectedIncident = incidents.find((i) => i.id === selectedIncidentId);
  const activeIncidents = incidents.filter((i) => (i.status || '').toUpperCase() === 'ACTIVE');
  const incidentsToShow = activeIncidents.length > 0 ? activeIncidents : incidents;

  const canCommanderOrAdmin = user && ['ADMIN', 'RCC'].includes((user.role || '').toString().trim().toUpperCase());
  const canActivateCommandRoom = !!user;
  const isCommander =
    canCommanderOrAdmin ||
    commandRoom?.roleAssignments?.some(
      (a) => a.role === 'COMMANDER' && a.user?.id === user?.id
    );
  const isRecorder = commandRoom?.roleAssignments?.some(
    (a) => a.role === 'RECORDER' && a.user?.id === user?.id
  );

  const showSituationalAwareness = !!selectedIncidentId;
  const showOperationalActions = !!selectedIncidentId;
  const { data: situationalData, loading: situationalLoading } = useSituationalAwareness(
    selectedIncidentId,
    socketRef ?? { current: null },
    showSituationalAwareness
  );
  const { actions: operationalActions, loading: operationalActionsLoading, refetch: refetchOperationalActions } =
    useOperationalActions(selectedIncidentId, socketRef ?? { current: null }, showOperationalActions);

  const fetchCommandRoom = async (incidentId: string) => {
    setLoading(true);
    try {
      const room = await disasterService.getCommandRoom(incidentId);
      setCommandRoom(isCommandRoom(room) ? room : null);
    } catch {
      setCommandRoom(null);
      enqueueSnackbar('Failed to load command room', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedIncidentId) {
      setCommandRoom(undefined);
      return;
    }
    fetchCommandRoom(selectedIncidentId);
  }, [selectedIncidentId]);

  useEffect(() => {
    const socket = socketRef?.current;
    if (!socket || !selectedIncidentId) return;
    socket.emit('join-incident-room', { incidentId: selectedIncidentId });
    return () => {
      socket.emit('leave-incident-room', { incidentId: selectedIncidentId });
    };
  }, [socketRef, selectedIncidentId]);

  useEffect(() => {
    const socket = socketRef?.current;
    if (!socket || !selectedIncidentId) return;
    const handler = (payload: { incidentId?: string }) => {
      if (payload?.incidentId === selectedIncidentId) {
        fetchCommandRoom(selectedIncidentId);
      }
    };
    socket.on('command-room-updated', handler);
    return () => {
      socket.off('command-room-updated', handler);
    };
  }, [socketRef, selectedIncidentId]);

  const handleActivate = async () => {
    if (!selectedIncidentId) return;
    setActivating(true);
    try {
      const room = await disasterService.activateCommandRoom(selectedIncidentId);
      setCommandRoom(isCommandRoom(room) ? room : null);
      onRefresh();
      enqueueSnackbar('Command room activated', { variant: 'success' });
    } catch (err: any) {
      enqueueSnackbar(err?.response?.data?.message || 'Failed to activate command room', { variant: 'error' });
    } finally {
      setActivating(false);
    }
  };

  const handleClose = async () => {
    if (!selectedIncidentId) return;
    setCloseConfirmOpen(false);
    setClosing(true);
    try {
      await disasterService.closeCommandRoom(selectedIncidentId);
      setCommandRoom(null);
      onRefresh();
      enqueueSnackbar('Command room closed', { variant: 'success' });
    } catch (err: any) {
      enqueueSnackbar(err?.response?.data?.message || 'Failed to close command room', { variant: 'error' });
    } finally {
      setClosing(false);
    }
  };

  const handleEscalate = async (level: EscalationLevel) => {
    if (!selectedIncidentId) return;
    setEscalating(true);
    try {
      const room = await disasterService.escalateCommandRoom(selectedIncidentId, level);
      setCommandRoom(isCommandRoom(room) ? room : null);
      onRefresh();
      enqueueSnackbar(`Escalated to ${ESCALATION_LABELS[level]}`, { variant: 'success' });
    } catch (err: any) {
      enqueueSnackbar(err?.response?.data?.message || 'Failed to escalate', { variant: 'error' });
    } finally {
      setEscalating(false);
    }
  };

  const handleRoleAssigned = () => fetchCommandRoom(selectedIncidentId!);
  const handleDecisionLogged = () => fetchCommandRoom(selectedIncidentId!);

  const escalationLevels: EscalationLevel[] = ['LEVEL_1', 'LEVEL_2', 'LEVEL_3'];
  const hasCommandRoom = isCommandRoom(commandRoom);
  const isCommandRoomActive = hasCommandRoom && !commandRoom.closedAt;
  const isCommandRoomClosed = hasCommandRoom && !!commandRoom.closedAt;
  const showActivateButton = !!selectedIncidentId && !loading && commandRoom === null && canActivateCommandRoom;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 2,
          p: 2,
          borderRadius: 2,
          backgroundColor: 'white',
          border: `1px solid ${theme.borderColor}`,
        }}
      >
        <FormControl size="small" sx={{ minWidth: 280 }}>
          <InputLabel>Select incident</InputLabel>
          <Select
            value={selectedIncidentId || ''}
            label="Select incident"
            onChange={(e) => setSelectedIncidentId((e.target.value as string) || null)}
            sx={{
              '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: theme.primary },
            }}
          >
            <MenuItem value="">
              <em>None</em>
            </MenuItem>
            {incidentsToShow.map((inc) => (
              <MenuItem key={inc.id} value={inc.id}>
                {inc.disasterScope && `[${inc.disasterScope}] `}
                {getIncidentTypeLabel(inc.incidentType)}
                {inc.locationAddress && ` — ${inc.locationAddress}`}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {selectedIncidentId && loading ? (
          <Skeleton variant="text" width={120} />
        ) : showActivateButton ? (
          <Button
            variant="contained"
            startIcon={<PlayArrow />}
            disabled={activating}
            onClick={handleActivate}
            sx={{ bgcolor: theme.primary, '&:hover': { bgcolor: theme.gradientStart } }}
          >
            {activating ? 'Activating…' : 'Activate Command Room'}
          </Button>
        ) : selectedIncidentId && isCommandRoomActive ? (
          <>
            <Chip
              icon={<MeetingRoom />}
              label={`${ESCALATION_LABELS[commandRoom.escalationLevel]}`}
              size="medium"
              sx={{
                bgcolor: `${theme.primary}15`,
                color: theme.primary,
                fontWeight: 600,
              }}
            />
            {isCommander && (
              <>
                {escalationLevels.indexOf(commandRoom.escalationLevel) <
                  escalationLevels.length - 1 && (
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {escalationLevels
                      .slice(escalationLevels.indexOf(commandRoom.escalationLevel) + 1)
                      .map((level) => (
                        <Button
                          key={level}
                          size="small"
                          variant="outlined"
                          startIcon={<TrendingUp />}
                          disabled={escalating}
                          onClick={() => handleEscalate(level)}
                          sx={{ borderColor: theme.primary, color: theme.primary }}
                        >
                          {ESCALATION_LABELS[level]}
                        </Button>
                      ))}
                  </Box>
                )}
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<Stop />}
                  disabled={closing}
                  onClick={() => setCloseConfirmOpen(true)}
                >
                  {closing ? 'Closing…' : 'Close Command Room'}
                </Button>
                <Tooltip title="Refresh command room">
                  <IconButton
                    size="small"
                    onClick={() => {
                      if (selectedIncidentId) {
                        fetchCommandRoom(selectedIncidentId);
                        refetchOperationalActions();
                      }
                    }}
                    disabled={loading}
                    sx={{ color: theme.primary }}
                  >
                    <Refresh />
                  </IconButton>
                </Tooltip>
              </>
            )}
          </>
        ) : null}
      </Box>

      {selectedIncidentId && isCommandRoomActive && (
        <Box sx={{ px: 0 }}>
          <CommandRoomVideoPanel
            incidentId={selectedIncidentId}
            theme={theme}
            enabled={true}
          />
        </Box>
      )}

      {!selectedIncidentId && (
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          Select an active incident to view or activate the command room.
        </Alert>
      )}

      {selectedIncidentId && loading && (
        <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
      )}

      {selectedIncidentId && !loading && (
        <Grid container spacing={2}>
          {showSituationalAwareness && (
            <>
              {situationalLoading ? (
                <>
                  <Grid item xs={12} md={6}>
                    <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
                  </Grid>
                </>
              ) : (
                <>
                  <Grid item xs={12} md={6}>
                    <CommandIncidentStatusPanel data={situationalData?.incident ?? null} theme={theme} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <CommandEMSPanel data={situationalData?.ems ?? null} theme={theme} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <CommandHospitalCapacityPanel data={situationalData?.hospital ?? null} theme={theme} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <CommandLiveKPIsPanel data={situationalData?.kpis ?? null} theme={theme} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <CommandEscalationTriggersPanel
                      data={situationalData?.escalationTriggers ?? null}
                      currentLevel={commandRoom?.escalationLevel ?? situationalData?.incident?.escalationLevel ?? null}
                      suggestedLevel={situationalData?.suggestedLevel ?? null}
                      theme={theme}
                    />
                  </Grid>
                </>
              )}
            </>
          )}
          {selectedIncident && (
            <Grid item xs={12}>
              <CommandDeploymentSummary
                assignments={selectedIncident.ambulanceAssignments ?? []}
                theme={theme}
              />
            </Grid>
          )}
          {selectedIncidentId && showOperationalActions && (
            <Grid item xs={12}>
              <CommandOperationalActionLog
                actions={operationalActions}
                loading={operationalActionsLoading}
                theme={theme}
              />
            </Grid>
          )}
          {selectedIncidentId && (
            <>
              {isCommandRoomActive ? (
                <>
                  <Grid item xs={12} md={6}>
                    <CommandRolePanel
                      incidentId={selectedIncidentId}
                      roleAssignments={commandRoom.roleAssignments ?? []}
                      canAssign={!!isCommander}
                      requiredRoles={situationalData?.requiredRolesForLevel}
                      theme={theme}
                      onRoleAssigned={handleRoleAssigned}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <CommandDecisionLog
                      incidentId={selectedIncidentId}
                      decisions={commandRoom.decisionLogs ?? []}
                      canLog={!!(isCommander || isRecorder)}
                      theme={theme}
                      onDecisionLogged={handleDecisionLogged}
                    />
                  </Grid>
                </>
              ) : (
                <Grid item xs={12}>
                  <Alert severity="info" sx={{ borderRadius: 2 }}>
                    <strong>Command Roles &amp; Decision Log</strong> — Activate the command room above to assign team roles (Commander, EMS Coordinator, Hospital Lead, Recorder, etc.) and log decisions.
                  </Alert>
                </Grid>
              )}
            </>
          )}
          <Grid item xs={12}>
            <CommandCapacityPanel theme={theme} />
          </Grid>
        </Grid>
      )}

      {selectedIncidentId && !loading && commandRoom === null && isCommander && (
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          No command room is active. Click <strong>&quot;Activate Command Room&quot;</strong> above to start. After activation you can assign roles, escalate the level, and log decisions.
        </Alert>
      )}

      {selectedIncidentId && !loading && commandRoom === null && !isCommander && (
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          No command room is active for this incident. Only Commander or Admin can activate it.
        </Alert>
      )}

      {selectedIncidentId && !loading && isCommandRoomClosed && (
          <Alert severity="success" sx={{ borderRadius: 2 }}>
            Command room was closed.
            {commandRoom.closedBy &&
              ` Closed by ${commandRoom.closedBy.firstName || ''} ${commandRoom.closedBy.lastName || ''}`.trim()}
          </Alert>
        )}

      <Dialog open={closeConfirmOpen} onClose={() => setCloseConfirmOpen(false)}>
        <DialogTitle>Close Command Room</DialogTitle>
        <DialogContent>
          Are you sure? This will close the command room.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCloseConfirmOpen(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleClose} disabled={closing}>
            {closing ? 'Closing…' : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
