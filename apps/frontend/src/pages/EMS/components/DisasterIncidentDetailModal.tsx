import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Chip,
  Grid,
  Divider,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  TextField,
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faExclamationTriangle,
  faMapMarkerAlt,
  faAmbulance,
  faBullhorn,
  faHistory,
  faCheckCircle,
  faMapPin,
  faUserInjured,
  faTruck,
  faComments,
  faPaperPlane,
} from '@fortawesome/free-solid-svg-icons';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { disasterService, DisasterIncident, getIncidentTypeLabel } from '../../../services/disasterService';
import { authService } from '../../../services/authService';
import { getWebSocketUrl } from '../../../utils/socketUtils';
import { io } from 'socket.io-client';
import { hospitalService, Hospital } from '../../../services/hospitalService';
import { useAuth } from '../../../contexts/AuthContext';
import { useSnackbar } from 'notistack';
import { format } from 'date-fns';

const disasterIcon = L.divIcon({
  html: `<div style="
    width: 28px; height: 28px;
    background: #DC2626; border: 2px solid white; border-radius: 50%;
    box-shadow: 0 2px 5px rgba(0,0,0,0.3);
  "></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const ambulanceIcon = L.divIcon({
  html: `<div style="
    width: 24px; height: 24px;
    background: #2563EB; border: 2px solid white; border-radius: 50%;
    box-shadow: 0 2px 5px rgba(0,0,0,0.3);
  "></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const COLOR_MAP: Record<string, string> = {
  RED: '#DC2626',
  YELLOW: '#D97706',
  GREEN: '#059669',
  BLACK: '#374151',
};

interface DisasterIncidentDetailModalProps {
  incidentId: string | null;
  open: boolean;
  onClose: () => void;
  onResolved?: () => void;
}

const DisasterIncidentDetailModal: React.FC<DisasterIncidentDetailModalProps> = ({
  incidentId,
  open,
  onClose,
  onResolved,
}) => {
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [incident, setIncident] = useState<DisasterIncident | null>(null);
  const [loading, setLoading] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [messages, setMessages] = useState<Array<{ id: string; content: string; createdAt: string; createdBy: { firstName?: string; lastName?: string } }>>([]);
  const [messageInput, setMessageInput] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  const canResolve = user && ['ADMIN', 'RCC'].includes(user.role);
  const canManageAssignments = user && ['ADMIN', 'RCC', 'EMS'].includes(user.role);

  const fetchIncident = () => {
    if (incidentId) {
      disasterService.getIncident(incidentId).then(setIncident).catch(() => {});
    }
  };

  useEffect(() => {
    if (open && incidentId) {
      setLoading(true);
      setError(null);
      Promise.all([
        disasterService.getIncident(incidentId),
        hospitalService.getAllHospitals(),
        disasterService.getMessages(incidentId),
      ])
        .then(([inc, hosp, msgs]) => {
          setIncident(inc);
          setHospitals(hosp || []);
          setMessages(msgs || []);
        })
        .catch((err) => {
          setError(err.response?.data?.message || 'Failed to load incident');
        })
        .finally(() => setLoading(false));
    } else {
      setIncident(null);
      setMessages([]);
      setMessageInput('');
    }
  }, [open, incidentId]);

  useEffect(() => {
    if (!open || !incidentId || !user) return;
    const token = authService.getToken();
    if (!token) return;
    const socket = io(getWebSocketUrl() + '/disasters', {
      transports: ['websocket', 'polling'],
      auth: { token },
    });
    const handler = (msg: { disasterIncidentId: string }) => {
      if (msg.disasterIncidentId === incidentId) {
        disasterService.getMessages(incidentId).then(setMessages);
      }
    };
    socket.on('message-created', handler);
    return () => {
      socket.off('message-created', handler);
      socket.disconnect();
    };
  }, [open, incidentId, user]);

  const handleResolve = async () => {
    if (!incidentId || !incident) return;
    setResolving(true);
    try {
      await disasterService.resolveIncident(incidentId);
      enqueueSnackbar('Incident resolved successfully', { variant: 'success' });
      onResolved?.();
      onClose();
    } catch (err: any) {
      enqueueSnackbar(err.response?.data?.message || 'Failed to resolve', { variant: 'error' });
    } finally {
      setResolving(false);
    }
  };

  const runAction = async (
    key: string,
    fn: () => Promise<void>
  ) => {
    setActionLoading(key);
    try {
      await fn();
      enqueueSnackbar('Updated successfully', { variant: 'success' });
      fetchIncident();
      onResolved?.();
    } catch (err: any) {
      enqueueSnackbar(err.response?.data?.message || 'Action failed', { variant: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkArrived = (assignmentId: string) =>
    runAction(`arrived-${assignmentId}`, () =>
      disasterService.markAmbulanceArrived(incidentId!, assignmentId)
    );

  const handleSetDestination = (assignmentId: string, hospitalId: string) =>
    runAction(`dest-${assignmentId}`, () =>
      disasterService.setAssignmentDestination(incidentId!, assignmentId, hospitalId)
    );

  const handleUpdateTriageCategory = (assignmentId: string, triageCategory: 'RED' | 'YELLOW' | 'GREEN' | 'BLACK') =>
    runAction(`triage-${assignmentId}`, () =>
      disasterService.updateAssignmentTriageCategory(incidentId!, assignmentId, triageCategory)
    );

  const handleBulkDestination = (triageCategory: string, hospitalId: string) =>
    runAction(`bulk-${triageCategory}`, () =>
      disasterService.bulkSetDestinationByCategory(
        incidentId!,
        triageCategory as 'RED' | 'YELLOW' | 'GREEN' | 'BLACK',
        hospitalId
      )
    );

  const handlePatientLoaded = (assignmentId: string) =>
    runAction(`loaded-${assignmentId}`, () =>
      disasterService.markPatientLoaded(incidentId!, assignmentId)
    );

  const handleDeparted = (assignmentId: string) =>
    runAction(`departed-${assignmentId}`, () =>
      disasterService.markDepartedToHospital(incidentId!, assignmentId)
    );

  const handleSendMessage = async () => {
    const content = messageInput.trim();
    if (!content || !incidentId || !canManageAssignments) return;
    setSendingMessage(true);
    try {
      const msg = await disasterService.createMessage(incidentId, content);
      setMessages((prev) => [...prev, msg]);
      setMessageInput('');
    } catch (err: any) {
      enqueueSnackbar(err.response?.data?.message || 'Failed to send message', { variant: 'error' });
    } finally {
      setSendingMessage(false);
    }
  };

  if (!open) return null;

  const totalCasualties =
    (incident?.estimatedGreen || 0) +
    (incident?.estimatedYellow || 0) +
    (incident?.estimatedRed || 0) +
    (incident?.estimatedBlack || 0);

  const mapCenter: [number, number] = incident
    ? [incident.locationLat, incident.locationLng]
    : [16.89, 42.55];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#856404' }}>
        <FontAwesomeIcon icon={faExclamationTriangle} />
        Disaster Incident Details
      </DialogTitle>
      <DialogContent>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : incident ? (
          <Box sx={{ pt: 1 }}>
            {/* Map */}
            <Box sx={{ mb: 2, borderRadius: 1, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
              <div style={{ height: 280 }}>
                <MapContainer
                  center={mapCenter}
                  zoom={14}
                  style={{ height: '100%', width: '100%' }}
                  zoomControl={true}
                  scrollWheelZoom={true}
                >
                  <TileLayer
                    attribution='&copy; OpenStreetMap'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    maxZoom={19}
                  />
                  <Marker position={[incident.locationLat, incident.locationLng]} icon={disasterIcon}>
                    <Popup>
                      <strong>Incident Location</strong>
                      <br />
                      {incident.locationAddress || `${incident.locationLat.toFixed(4)}, ${incident.locationLng.toFixed(4)}`}
                    </Popup>
                  </Marker>
                  {incident.ambulanceAssignments?.map(
                    (a) =>
                      a.ambulance?.currentLocationLat &&
                      a.ambulance?.currentLocationLng && (
                        <Marker
                          key={a.id}
                          position={[a.ambulance.currentLocationLat, a.ambulance.currentLocationLng]}
                          icon={ambulanceIcon}
                        >
                          <Popup>
                            <strong>{a.ambulance.callSign || 'Ambulance'}</strong>
                            <br />
                            Status: {a.status}
                          </Popup>
                        </Marker>
                      )
                  )}
                </MapContainer>
              </div>
            </Box>

            {/* Incident Info */}
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1 }}>
                  {incident.disasterScope && (
                    <Chip label={incident.disasterScope} size="small" variant="outlined" sx={{ mr: 0.5 }} />
                  )}
                  <Chip label={getIncidentTypeLabel(incident.incidentType)} size="small" color="warning" />
                  {incident.colorCode && (
                    <Chip
                      label={incident.colorCode}
                      size="small"
                      sx={{ bgcolor: COLOR_MAP[incident.colorCode] || '#D97706', color: '#fff' }}
                    />
                  )}
                  <Chip label={incident.status} size="small" variant="outlined" />
                </Box>
                <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                  <FontAwesomeIcon icon={faMapMarkerAlt} size="sm" />
                  {incident.locationAddress || `${incident.locationLat.toFixed(4)}, ${incident.locationLng.toFixed(4)}`}
                </Typography>
                {incident.locationDescription && (
                  <Typography variant="caption" color="text.secondary" display="block">
                    {incident.locationDescription}
                  </Typography>
                )}
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                  Created by {incident.createdBy?.firstName} {incident.createdBy?.lastName} ·{' '}
                  {format(new Date(incident.createdAt), 'PPpp')}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                {totalCasualties > 0 && (
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Casualties
                    </Typography>
                    <Typography variant="body2">
                      G: {incident.estimatedGreen || 0} · Y: {incident.estimatedYellow || 0} · R:{' '}
                      {incident.estimatedRed || 0} · B: {incident.estimatedBlack || 0} = {totalCasualties}
                    </Typography>
                  </Box>
                )}
                {incident.estimatedETA && (
                  <Typography variant="caption" display="block">
                    ETA: {format(new Date(incident.estimatedETA), 'PPpp')}
                  </Typography>
                )}
                {incident.notes && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {incident.notes}
                  </Typography>
                )}
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />

            {/* Ambulance Assignments - grouped by triage category for MCI */}
            {incident.ambulanceAssignments && incident.ambulanceAssignments.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <FontAwesomeIcon icon={faAmbulance} size="sm" />
                  Assigned Ambulances
                </Typography>
                {(() => {
                  const categories: Array<{ label: string; key: string }> = [
                    { label: 'RED (Immediate)', key: 'RED' },
                    { label: 'YELLOW (Delayed)', key: 'YELLOW' },
                    { label: 'GREEN (Minor)', key: 'GREEN' },
                    { label: 'BLACK (Deceased)', key: 'BLACK' },
                    { label: 'Uncategorized', key: '__NONE__' },
                  ];
                  return (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      {categories.map(({ label, key }) => {
                        const assignments =
                          key === '__NONE__'
                            ? incident.ambulanceAssignments!.filter((a) => !a.triageCategory)
                            : incident.ambulanceAssignments!.filter((a) => a.triageCategory === key);
                        if (assignments.length === 0) return null;
                        const withoutDest = assignments.filter((a) => !a.destinationHospital);
                        return (
                          <Box key={key}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5, flexWrap: 'wrap', gap: 0.5 }}>
                              <Typography variant="caption" fontWeight={600} color="text.secondary">
                                {label}
                              </Typography>
                              {canManageAssignments && incident?.status === 'ACTIVE' && incident?.incidentType === 'RTA_MCI' && key !== '__NONE__' && withoutDest.length > 0 && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <FormControl size="small" sx={{ minWidth: 160 }}>
                                    <InputLabel>Set default for {key}</InputLabel>
                                    <Select
                                      value=""
                                      label={`Set default for ${key}`}
                                      onChange={(e) => {
                                        const id = e.target.value;
                                        if (id) handleBulkDestination(key, id);
                                      }}
                                      disabled={!!actionLoading}
                                    >
                                      <MenuItem value="">—</MenuItem>
                                      {hospitals.map((h) => (
                                        <MenuItem key={h.id} value={h.id}>
                                          Apply {h.name} to {withoutDest.length} unassigned
                                        </MenuItem>
                                      ))}
                                    </Select>
                                  </FormControl>
                                </Box>
                              )}
                            </Box>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                              {assignments.map((a) => (
                                <Box
                                  key={a.id}
                                  sx={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: 1,
                                    p: 1,
                                    bgcolor: 'action.hover',
                                    borderRadius: 1,
                                  }}
                                >
                                  <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography variant="body2" fontWeight={600}>
                                      {a.ambulance?.callSign || 'Ambulance'}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" display="block">
                                      {a.distanceKm != null ? `${a.distanceKm.toFixed(1)} km` : ''} · {a.status} ·{' '}
                                      {a.assignedBy?.firstName} {a.assignedBy?.lastName}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" display="block">
                                      Destination: {a.destinationHospital?.name || '—'}
                                    </Typography>
                                  </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                                    <Chip label={a.status} size="small" />
                                    {canManageAssignments && incident?.status === 'ACTIVE' && incident?.incidentType === 'RTA_MCI' && (
                                      <FormControl size="small" sx={{ minWidth: 120 }}>
                                        <InputLabel>Category</InputLabel>
                                        <Select
                                          value={a.triageCategory || 'RED'}
                                          label="Category"
                                          onChange={(e) => {
                                            const cat = e.target.value as 'RED' | 'YELLOW' | 'GREEN' | 'BLACK';
                                            handleUpdateTriageCategory(a.id, cat);
                                          }}
                                          disabled={!!actionLoading}
                                        >
                                          <MenuItem value="RED">RED</MenuItem>
                                          <MenuItem value="YELLOW">YELLOW</MenuItem>
                                          <MenuItem value="GREEN">GREEN</MenuItem>
                                          <MenuItem value="BLACK">BLACK</MenuItem>
                                        </Select>
                                      </FormControl>
                                    )}
                                    {canManageAssignments && incident?.status === 'ACTIVE' && (
                                      <>
                                        {a.status === 'EN_ROUTE' && (
                                          <Tooltip title="Mark arrived at scene">
                                            <IconButton
                                              size="small"
                                              onClick={() => handleMarkArrived(a.id)}
                                              disabled={!!actionLoading}
                                            >
                                              {actionLoading === `arrived-${a.id}` ? (
                                                <CircularProgress size={18} />
                                              ) : (
                                                <FontAwesomeIcon icon={faMapPin} />
                                              )}
                                            </IconButton>
                                          </Tooltip>
                                        )}
                                        <FormControl size="small" sx={{ minWidth: 140 }}>
                                          <InputLabel>Destination</InputLabel>
                                          <Select
                                            value={a.destinationHospital?.id || ''}
                                            label="Destination"
                                            onChange={(e) => {
                                              const id = e.target.value;
                                              if (id) handleSetDestination(a.id, id);
                                            }}
                                            disabled={!!actionLoading}
                                          >
                                            <MenuItem value="">
                                              <em>Not assigned</em>
                                            </MenuItem>
                                            {hospitals.map((h) => (
                                              <MenuItem key={h.id} value={h.id}>
                                                {h.name}
                                              </MenuItem>
                                            ))}
                                          </Select>
                                        </FormControl>
                                        {a.status === 'AT_SCENE' && (
                                          <Tooltip title="Patient loaded">
                                            <IconButton
                                              size="small"
                                              onClick={() => handlePatientLoaded(a.id)}
                                              disabled={!!actionLoading}
                                            >
                                              {actionLoading === `loaded-${a.id}` ? (
                                                <CircularProgress size={18} />
                                              ) : (
                                                <FontAwesomeIcon icon={faUserInjured} />
                                              )}
                                            </IconButton>
                                          </Tooltip>
                                        )}
                                        {(a.status === 'PATIENT_LOADED' || a.status === 'AT_SCENE') && a.destinationHospital && (
                                          <Tooltip title="Departed to hospital">
                                            <IconButton
                                              size="small"
                                              onClick={() => handleDeparted(a.id)}
                                              disabled={!!actionLoading}
                                            >
                                              {actionLoading === `departed-${a.id}` ? (
                                                <CircularProgress size={18} />
                                              ) : (
                                                <FontAwesomeIcon icon={faTruck} />
                                              )}
                                            </IconButton>
                                          </Tooltip>
                                        )}
                                      </>
                                    )}
                                  </Box>
                                </Box>
                              ))}
                            </Box>
                          </Box>
                        );
                      })}
                    </Box>
                  );
                })()}
              </Box>
            )}

            {/* Announcements */}
            {incident.announcements && incident.announcements.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <FontAwesomeIcon icon={faBullhorn} size="sm" />
                  Announcements
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  {incident.announcements.map((ann) => (
                    <Box
                      key={ann.id}
                      sx={{
                        p: 1,
                        bgcolor: '#fffbf0',
                        border: '1px solid #ffc107',
                        borderRadius: 1,
                      }}
                    >
                      <Typography variant="body2">{ann.announcementText}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {ann.status} · {format(new Date(ann.createdAt), 'PPpp')}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}

            {/* Chat / Messages */}
            {canManageAssignments && incident.status === 'ACTIVE' && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <FontAwesomeIcon icon={faComments} size="sm" />
                  Incident Chat
                </Typography>
                <Box
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    overflow: 'hidden',
                    maxHeight: 200,
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <Box
                    sx={{
                      overflow: 'auto',
                      flex: 1,
                      p: 1.5,
                      minHeight: 120,
                    }}
                  >
                    {messages.length === 0 ? (
                      <Typography variant="caption" color="text.secondary">
                        No messages yet. Start the conversation.
                      </Typography>
                    ) : (
                      messages.map((m) => (
                        <Box
                          key={m.id}
                          sx={{
                            mb: 1,
                            p: 1,
                            bgcolor: 'action.hover',
                            borderRadius: 1,
                          }}
                        >
                          <Typography variant="body2">{m.content}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {m.createdBy?.firstName} {m.createdBy?.lastName} · {format(new Date(m.createdAt), 'HH:mm')}
                          </Typography>
                        </Box>
                      ))
                    )}
                  </Box>
                  <Box
                    sx={{
                      display: 'flex',
                      gap: 1,
                      p: 1,
                      borderTop: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <TextField
                      size="small"
                      fullWidth
                      placeholder="Type a message..."
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                    />
                    <Button
                      variant="contained"
                      size="small"
                      onClick={handleSendMessage}
                      disabled={!messageInput.trim() || sendingMessage}
                      startIcon={sendingMessage ? <CircularProgress size={16} /> : <FontAwesomeIcon icon={faPaperPlane} />}
                    >
                      Send
                    </Button>
                  </Box>
                </Box>
              </Box>
            )}

            {/* Audit Log / Timeline */}
            {incident.auditLogs && incident.auditLogs.length > 0 && (
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <FontAwesomeIcon icon={faHistory} size="sm" />
                  Activity Timeline
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  {incident.auditLogs
                    .sort(
                      (a, b) =>
                        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                    )
                    .slice(0, 10)
                    .map((log, idx) => (
                      <Typography key={idx} variant="caption" display="block">
                        {log.action} · {format(new Date(log.createdAt), 'PPpp')}
                      </Typography>
                    ))}
                </Box>
              </Box>
            )}
          </Box>
        ) : null}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        {canResolve && incident?.status === 'ACTIVE' && (
          <Button
            variant="contained"
            color="success"
            startIcon={resolving ? <CircularProgress size={18} /> : <FontAwesomeIcon icon={faCheckCircle} />}
            onClick={handleResolve}
            disabled={resolving}
          >
            Resolve Incident
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default DisasterIncidentDetailModal;
