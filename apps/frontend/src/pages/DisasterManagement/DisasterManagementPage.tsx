import React, { useEffect, useState, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  Skeleton,
  Alert,
} from '@mui/material';
import {
  Add,
  Warning,
  Map,
  List,
  Schedule,
  LocalHospital,
  Info,
  People,
  MeetingRoom,
} from '@mui/icons-material';
import { Helmet } from 'react-helmet-async';
import { useSnackbar } from 'notistack';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/authService';
import { getWebSocketUrl } from '../../utils/socketUtils';
import { format } from 'date-fns';
import { disasterService, DisasterIncident, getIncidentTypeLabel } from '../../services/disasterService';
import { LiveAmbulanceMap } from '../../components/LiveTracking';
import DisasterIncidentForm from '../EMS/components/DisasterIncidentForm';
import DisasterIncidentDetailModal from '../EMS/components/DisasterIncidentDetailModal';
import DisasterStepsIndicator from '../../components/DisasterSteps/DisasterStepsIndicator';
import { DisasterCommandRoomDashboard } from './components/CommandRoom/DisasterCommandRoomDashboard';
import PortalSkeleton, { PortalStep } from '../../components/Common/PortalSkeleton';
import { getTheme } from '../../components/Common/KPI/kpiStyles';

const COLOR_MAP: Record<string, string> = {
  RED: '#DC2626',
  YELLOW: '#D97706',
  GREEN: '#059669',
  BLACK: '#374151',
};

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  const isActive = value === index;
  return (
    <div
      role="tabpanel"
      id={`disaster-tabpanel-${index}`}
      aria-labelledby={`disaster-tab-${index}`}
      aria-hidden={!isActive}
      style={{ display: isActive ? 'block' : 'none' }}
      {...other}
    >
      {isActive && <Box sx={{ p: 1.5, minHeight: 120 }}>{children}</Box>}
    </div>
  );
}

const DisasterManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [incidents, setIncidents] = useState<DisasterIncident[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [selectedTriageCategory, setSelectedTriageCategory] = useState<
    'RED' | 'YELLOW' | 'GREEN' | 'BLACK'
  >('RED');
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailIncidentId, setDetailIncidentId] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const theme = getTheme('disaster');

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      const data = await disasterService.getActiveIncidents();
      setIncidents(data);
    } catch (err) {
      console.error('Failed to fetch disaster incidents:', err);
      enqueueSnackbar('Failed to load incidents', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchIncidents();

    const token = authService.getToken();
    if (!token) return;

    const baseUrl = getWebSocketUrl();
    const namespace = '/disasters';
    const socket = io(baseUrl + namespace, {
      transports: ['websocket', 'polling'],
      auth: { token },
    });
    socketRef.current = socket;

    socket.on('incident-created', () => fetchIncidents());
    socket.on('incident-updated', () => fetchIncidents());
    socket.on('incident-resolved', () => fetchIncidents());
    socket.on('ambulance-assigned', () => fetchIncidents());
    socket.on('announcement', () => fetchIncidents());
    socket.on('command-room-updated', () => fetchIncidents());

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user]);

  const handleAssignAmbulance = async (
    incidentId: string,
    ambulanceId: string,
    _ambulance?: unknown,
    triageCategory?: string
  ) => {
    const selectedIncident = incidents.find((i) => i.id === incidentId);
    const category =
      selectedIncident?.incidentType === 'RTA_MCI'
        ? (triageCategory || selectedTriageCategory)
        : undefined;
    setAssigningId(ambulanceId);
    try {
      await disasterService.assignAmbulance(incidentId, ambulanceId, category as any);
      enqueueSnackbar('Ambulance assigned successfully', { variant: 'success' });
      fetchIncidents();
    } catch (err: any) {
      enqueueSnackbar(
        err.response?.data?.message || 'Failed to assign ambulance',
        { variant: 'error' }
      );
    } finally {
      setAssigningId(null);
    }
  };

  const handleIncidentSelect = (incidentId: string | null) => {
    setSelectedIncidentId(incidentId);
  };

  const handleViewDetails = (e: React.MouseEvent, incidentId: string) => {
    e.stopPropagation();
    setDetailIncidentId(incidentId);
    setDetailModalOpen(true);
  };

  const totalCasualties = incidents.reduce(
    (sum, i) =>
      sum +
      (i.estimatedGreen || 0) +
      (i.estimatedYellow || 0) +
      (i.estimatedRed || 0) +
      (i.estimatedBlack || 0),
    0
  );

  const totalAmbulances = incidents.reduce(
    (sum, i) => sum + (i.ambulanceAssignments?.length || 0),
    0
  );

  const portalSteps: PortalStep[] = [
    { label: 'Live Map', description: 'Assign ambulances and track incidents', icon: <Map /> },
    {
      label: 'Active Incidents',
      description: 'View and manage incident cards',
      icon: <List />,
    },
    {
      label: 'Command Room',
      description: 'Real-time disaster command and coordination',
      icon: <MeetingRoom />,
    },
  ];

  const kpiCards = [
    {
      title: 'Active Incidents',
      value: incidents.length,
      icon: <Warning />,
      color: theme.primary,
    },
    {
      title: 'Total Casualties',
      value: totalCasualties,
      icon: <People />,
      color: '#DC2626',
    },
    {
      title: 'Ambulances Assigned',
      value: totalAmbulances,
      icon: <LocalHospital />,
      color: '#2563EB',
    },
  ];

  const canViewDisasters = user && ['ADMIN', 'RCC', 'EMS'].includes((user.role || '').toUpperCase());
  if (!canViewDisasters) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          You do not have access to Disaster Management.
        </Alert>
      </Box>
    );
  }

  return (
    <>
      <Helmet>
        <title>Disaster Management | MASAR</title>
      </Helmet>

      <PortalSkeleton
        title="Disaster Management Portal"
        subtitle="Live incident management & ambulance assignment"
        portalType="disaster"
        steps={portalSteps}
        activeStep={activeTab}
        onRefresh={fetchIncidents}
        onCreateCase={() => setFormOpen(true)}
        kpiCards={kpiCards}
      >
        <Box
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            mb: 0.5,
            position: 'sticky',
            top: 0,
            zIndex: 100,
            backgroundColor: '#f8f9fa',
          }}
        >
          <Tabs
            value={activeTab}
            onChange={(_e, v) => setActiveTab(Number(v))}
            aria-label="disaster portal tabs"
            sx={{ minHeight: 48 }}
          >
            <Tab
              id="disaster-tab-0"
              label="Live Map"
              icon={<Map fontSize="small" />}
              iconPosition="start"
              sx={{
                fontSize: '1rem',
                fontWeight: activeTab === 0 ? 'bold' : 'normal',
                py: 2,
                px: 3,
              }}
            />
            <Tab
              id="disaster-tab-1"
              label="Active Incidents"
              icon={<List fontSize="small" />}
              iconPosition="start"
              sx={{
                fontSize: '1rem',
                fontWeight: activeTab === 1 ? 'bold' : 'normal',
                py: 2,
                px: 3,
              }}
            />
            <Tab
              id="disaster-tab-2"
              label="Command Room"
              icon={<MeetingRoom fontSize="small" />}
              iconPosition="start"
              sx={{
                fontSize: '1rem',
                fontWeight: activeTab === 2 ? 'bold' : 'normal',
                py: 2,
                px: 3,
              }}
            />
          </Tabs>
        </Box>

        <TabPanel value={activeTab} index={0}>
          <Box sx={{ mb: 2 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                flexWrap: 'wrap',
                p: 2,
                borderRadius: 2,
                backgroundColor: 'white',
                border: `1px solid ${theme.borderColor}`,
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              }}
            >
              <FormControl size="small" sx={{ minWidth: 280 }}>
                <InputLabel>Assign ambulance to incident</InputLabel>
                <Select
                  value={selectedIncidentId || ''}
                  label="Assign ambulance to incident"
                  onChange={(e) =>
                    handleIncidentSelect((e.target.value as string) || null)
                  }
                  sx={{
                    '& .MuiOutlinedInput-root.Mui-focused fieldset': {
                      borderColor: theme.primary,
                    },
                  }}
                >
                  <MenuItem value="">
                    <em>None selected</em>
                  </MenuItem>
                  {incidents.map((inc) => (
                    <MenuItem key={inc.id} value={inc.id}>
                      {inc.disasterScope && `[${inc.disasterScope}] `}
                      {getIncidentTypeLabel(inc.incidentType)}
                      {inc.colorCode && ` · ${inc.colorCode}`} —{' '}
                      {inc.locationAddress ||
                        `${inc.locationLat.toFixed(4)}, ${inc.locationLng.toFixed(4)}`}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {selectedIncidentId &&
                incidents.find((i) => i.id === selectedIncidentId)
                  ?.incidentType === 'RTA_MCI' && (
                  <FormControl size="small" sx={{ minWidth: 200 }}>
                    <InputLabel>Assign to category</InputLabel>
                    <Select
                      value={selectedTriageCategory}
                      label="Assign to category"
                      onChange={(e) =>
                        setSelectedTriageCategory(
                          e.target.value as 'RED' | 'YELLOW' | 'GREEN' | 'BLACK'
                        )
                      }
                      sx={{
                        '& .MuiOutlinedInput-root.Mui-focused fieldset': {
                          borderColor: theme.primary,
                        },
                      }}
                    >
                      <MenuItem value="RED">RED (Immediate)</MenuItem>
                      <MenuItem value="YELLOW">YELLOW (Delayed)</MenuItem>
                      <MenuItem value="GREEN">GREEN (Minor)</MenuItem>
                      <MenuItem value="BLACK">BLACK (Deceased)</MenuItem>
                    </Select>
                  </FormControl>
                )}
              {totalCasualties > 0 && (
                <Chip
                  icon={<People fontSize="small" />}
                  label={`Total casualties: ${totalCasualties}`}
                  size="medium"
                  sx={{
                    bgcolor: `${theme.accentLight}`,
                    color: theme.accent,
                    fontWeight: 600,
                    border: `1px solid ${theme.borderColor}`,
                  }}
                />
              )}
            </Box>
          </Box>
          <Box
            sx={{
              borderRadius: 2,
              overflow: 'hidden',
              border: `1px solid ${theme.borderColor}`,
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              height: 'calc(100vh - 380px)',
              minHeight: 480,
              backgroundColor: 'white',
            }}
          >
            <LiveAmbulanceMap
              height="100%"
              autoRefresh
              refreshInterval={5000}
              useGPSAPI
              showControls
              showFilters
              disasterIncidents={incidents}
              selectedIncidentId={selectedIncidentId}
              onIncidentSelect={handleIncidentSelect}
              onAssignAmbulanceToDisaster={handleAssignAmbulance}
              assigningAmbulanceId={assigningId}
              selectedTriageCategory={
                incidents.find((i) => i.id === selectedIncidentId)?.incidentType ===
                'RTA_MCI'
                  ? selectedTriageCategory
                  : null
              }
            />
          </Box>
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          {loading ? (
            <Grid container spacing={2}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Grid item xs={12} sm={6} md={4} key={i}>
                  <Skeleton variant="rectangular" height={220} sx={{ borderRadius: 2 }} />
                </Grid>
              ))}
            </Grid>
          ) : incidents.length === 0 ? (
            <Alert
              severity="info"
              icon={<Warning />}
              sx={{
                borderRadius: 2,
                border: `1px solid ${theme.borderColor}`,
                '& .MuiAlert-message': {
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: 1,
                },
              }}
            >
              <Box>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  No active incidents
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Create an incident to get started with disaster management and
                  ambulance assignment.
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => setFormOpen(true)}
                  sx={{
                    mt: 2,
                    bgcolor: theme.primary,
                    '&:hover': { bgcolor: theme.gradientStart },
                  }}
                >
                  Create Incident
                </Button>
              </Box>
            </Alert>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {incidents.length} active incident{incidents.length !== 1 ? 's' : ''}
              </Typography>
              {totalCasualties > 0 && (
                <Chip
                  icon={<People fontSize="small" />}
                  label={`Total casualties: ${totalCasualties}`}
                  size="small"
                  sx={{
                    bgcolor: `${theme.accentLight}`,
                    color: theme.accent,
                    fontWeight: 600,
                  }}
                />
              )}
            </Box>
          )}

          {!loading && incidents.length > 0 && (
            <Grid container spacing={2}>
              {incidents.map((incident) => (
                <Grid item xs={12} sm={6} md={4} key={incident.id}>
                  <Card
                    sx={{
                      cursor: 'pointer',
                      borderLeft: `4px solid ${COLOR_MAP[incident.colorCode || 'YELLOW'] || '#D97706'}`,
                      borderRadius: 2,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                      border: `1px solid ${theme.borderColor}`,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        bgcolor: `${theme.accentLight}40`,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                        transform: 'translateY(-2px)',
                      },
                    }}
                    onClick={() => {
                      handleIncidentSelect(incident.id);
                      setActiveTab(0);
                    }}
                  >
                    <CardContent sx={{ '&:last-child': { pb: 2 } }}>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          mb: 1.5,
                        }}
                      >
                        <Box
                          sx={{
                            display: 'flex',
                            gap: 0.5,
                            flexWrap: 'wrap',
                            alignItems: 'center',
                          }}
                        >
                          {incident.disasterScope && (
                            <Chip
                              label={incident.disasterScope}
                              size="small"
                              sx={{ fontSize: '0.6rem', height: 18, mr: 0.5 }}
                            />
                          )}
                          <Chip
                            label={getIncidentTypeLabel(incident.incidentType)}
                            size="small"
                            sx={{
                              fontSize: '0.7rem',
                              height: 22,
                              fontWeight: 600,
                              bgcolor: `${theme.primary}15`,
                              color: theme.primary,
                            }}
                          />
                          {incident.colorCode && (
                            <Chip
                              label={incident.colorCode}
                              size="small"
                              sx={{
                                fontSize: '0.65rem',
                                height: 20,
                                bgcolor: COLOR_MAP[incident.colorCode] || '#D97706',
                                color: '#fff',
                              }}
                            />
                          )}
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ fontWeight: 500 }}
                          >
                            Ref: {incident.id.slice(0, 8)}
                          </Typography>
                        </Box>
                        <Tooltip title="View details">
                          <IconButton
                            size="small"
                            onClick={(e) => handleViewDetails(e, incident.id)}
                            sx={{ color: theme.textSecondary }}
                          >
                            <Info fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                      <Typography
                        variant="body2"
                        fontWeight={600}
                        sx={{ mb: 1, color: theme.textPrimary }}
                      >
                        {incident.locationAddress ||
                          `${incident.locationLat.toFixed(4)}, ${incident.locationLng.toFixed(4)}`}
                      </Typography>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          mb: 1,
                          flexWrap: 'wrap',
                        }}
                      >
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                        >
                          <Schedule sx={{ fontSize: 12 }} />
                          {incident.createdAt
                            ? format(new Date(incident.createdAt), 'dd/MM/yyyy HH:mm')
                            : '—'}
                        </Typography>
                        {incident.estimatedETA && (
                          <Typography
                            variant="caption"
                            sx={{ color: '#059669', fontWeight: 500 }}
                          >
                            ETA: {format(new Date(incident.estimatedETA), 'HH:mm')}
                          </Typography>
                        )}
                      </Box>
                      <Box
                        sx={{
                          display: 'flex',
                          gap: 1.5,
                          flexWrap: 'wrap',
                          mb: 1,
                        }}
                      >
                        {[
                          { key: 'G', cat: 'GREEN', count: incident.estimatedGreen ?? 0 },
                          {
                            key: 'Y',
                            cat: 'YELLOW',
                            count: incident.estimatedYellow ?? 0,
                          },
                          { key: 'R', cat: 'RED', count: incident.estimatedRed ?? 0 },
                          {
                            key: 'B',
                            cat: 'BLACK',
                            count: incident.estimatedBlack ?? 0,
                          },
                        ].map(({ key, cat, count }) => (
                          <Typography
                            key={cat}
                            variant="caption"
                            component="span"
                            sx={{
                              color: COLOR_MAP[cat],
                              fontWeight: 700,
                              bgcolor: `${COLOR_MAP[cat]}15`,
                              px: 1,
                              py: 0.25,
                              borderRadius: 1,
                            }}
                          >
                            {key}:{count}
                          </Typography>
                        ))}
                      </Box>
                      <DisasterStepsIndicator incident={incident} />
                      {incident.ambulanceAssignments &&
                        incident.ambulanceAssignments.length > 0 && (
                          <Box
                            sx={{
                              mt: 1.25,
                              pt: 1.25,
                              borderTop: `1px solid ${theme.borderColor}`,
                            }}
                          >
                            <Typography
                              variant="caption"
                              fontWeight={600}
                              color="text.secondary"
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5,
                                mb: 0.5,
                              }}
                            >
                              <LocalHospital sx={{ fontSize: 12 }} />
                              {incident.ambulanceAssignments.length} ambulance(s)
                            </Typography>
                            {incident.incidentType === 'RTA_MCI' ? (
                              ['RED', 'YELLOW', 'GREEN', 'BLACK'].map((cat) => {
                                const list = incident.ambulanceAssignments!.filter(
                                  (a) =>
                                    a.triageCategory === cat ||
                                    (!a.triageCategory && cat === 'RED')
                                );
                                if (list.length === 0) return null;
                                const catColor = COLOR_MAP[cat] || '#666';
                                return (
                                  <Box
                                    key={cat}
                                    sx={{
                                      display: 'flex',
                                      alignItems: 'flex-start',
                                      gap: 0.5,
                                      mb: 0.5,
                                    }}
                                  >
                                    <Chip
                                      label={cat}
                                      size="small"
                                      sx={{
                                        fontSize: '0.65rem',
                                        height: 18,
                                        minWidth: 44,
                                        bgcolor: catColor,
                                        color: '#fff',
                                      }}
                                    />
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                      {list.map((a) => (
                                        <Typography
                                          key={a.id}
                                          variant="caption"
                                          color="text.secondary"
                                          display="block"
                                          sx={{ fontSize: '0.7rem' }}
                                        >
                                          {a.ambulance?.callSign || 'A'} · {a.status}
                                          {a.destinationHospital && (
                                            <>
                                              {' → '}
                                              {a.destinationHospital.name}
                                            </>
                                          )}
                                        </Typography>
                                      ))}
                                    </Box>
                                  </Box>
                                );
                              })
                            ) : (
                              incident.ambulanceAssignments!.map((a) => (
                                <Typography
                                  key={a.id}
                                  variant="caption"
                                  color="text.secondary"
                                  display="block"
                                  sx={{ fontSize: '0.7rem' }}
                                >
                                  {a.ambulance?.callSign || 'A'} · {a.status}
                                  {a.destinationHospital &&
                                    ` → ${a.destinationHospital.name}`}
                                </Typography>
                              ))
                            )}
                          </Box>
                        )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <DisasterCommandRoomDashboard incidents={incidents} onRefresh={fetchIncidents} socketRef={socketRef} />
        </TabPanel>
      </PortalSkeleton>

      <DisasterIncidentForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={() => {
          fetchIncidents();
          setFormOpen(false);
        }}
      />

      <DisasterIncidentDetailModal
        incidentId={detailIncidentId}
        open={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setDetailIncidentId(null);
        }}
        onResolved={fetchIncidents}
      />
    </>
  );
};

export default DisasterManagementPage;
