import React, { useEffect, useState, useRef } from 'react';
import DisasterIncidentDetailModal from '../../pages/EMS/components/DisasterIncidentDetailModal';
import {
  Box,
  Drawer,
  IconButton,
  Typography,
  Chip,
  useTheme,
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faExclamationTriangle,
  faChevronRight,
} from '@fortawesome/free-solid-svg-icons';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/authService';
import { getWebSocketUrl } from '../../utils/socketUtils';
import { disasterService, DisasterIncident, getIncidentTypeLabel } from '../../services/disasterService';
import DisasterStepsIndicator from '../DisasterSteps/DisasterStepsIndicator';

const DRAWER_WIDTH = 320;
const BADGE_SIZE = 48;

const COLOR_MAP: Record<string, string> = {
  RED: '#DC2626',
  YELLOW: '#D97706',
  GREEN: '#059669',
  BLACK: '#374151',
};

const DisasterSidebar: React.FC = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [incidents, setIncidents] = useState<DisasterIncident[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  const fetchIncidents = async () => {
    try {
      const data = await disasterService.getActiveIncidents();
      setIncidents(data);
    } catch (err) {
      console.error('Failed to fetch disaster incidents:', err);
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

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user]);

  const totalCasualties = incidents.reduce(
    (sum, i) =>
      sum +
      (i.estimatedGreen || 0) +
      (i.estimatedYellow || 0) +
      (i.estimatedRed || 0) +
      (i.estimatedBlack || 0),
    0,
  );

  const canViewDisasters = user && ['ADMIN', 'RCC', 'EMS'].includes(user.role);
  if (!canViewDisasters) return null;

  return (
    <>
      {/* Floating badge when collapsed */}
      {!open && (
        <IconButton
          onClick={() => setOpen(true)}
          sx={{
            position: 'fixed',
            right: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: theme.zIndex.drawer + 1,
            width: BADGE_SIZE,
            height: BADGE_SIZE,
            borderRadius: '8px 0 0 8px',
            bgcolor: '#fff3cd',
            border: '1px solid #ffc107',
            color: '#856404',
            '&:hover': { bgcolor: '#ffe69c' },
          }}
          aria-label="Open disaster incidents"
        >
          <Box sx={{ position: 'relative' }}>
            <FontAwesomeIcon icon={faExclamationTriangle} size="lg" />
            {incidents.length > 0 && (
              <Chip
                label={incidents.length}
                size="small"
                sx={{
                  position: 'absolute',
                  top: -8,
                  right: -12,
                  height: 18,
                  minWidth: 18,
                  fontSize: '0.7rem',
                  bgcolor: '#DC2626',
                  color: '#fff',
                }}
              />
            )}
          </Box>
        </IconButton>
      )}

      <Drawer
        variant="persistent"
        anchor="right"
        open={open}
        sx={{
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            mt: '64px',
            boxSizing: 'border-box',
            bgcolor: '#fffbf0',
            borderLeft: '1px solid #ffc107',
          },
        }}
      >
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FontAwesomeIcon icon={faExclamationTriangle} color="#856404" />
            <Typography variant="subtitle1" fontWeight={600} color="#856404">
              Active Disasters
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => setOpen(false)}>
            <FontAwesomeIcon icon={faChevronRight} />
          </IconButton>
        </Box>

        {totalCasualties > 0 && (
          <Box sx={{ px: 2, pb: 1 }}>
            <Chip
              label={`Total casualties: ${totalCasualties}`}
              size="small"
              sx={{ bgcolor: '#fff3cd', color: '#856404', fontWeight: 600 }}
            />
          </Box>
        )}

        <Box sx={{ px: 2, pb: 2, overflow: 'auto', maxHeight: 'calc(100vh - 180px)' }}>
          {loading ? (
            <Typography variant="body2" color="text.secondary">
              Loading...
            </Typography>
          ) : incidents.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No active disasters
            </Typography>
          ) : (
            incidents.map((incident) => (
              <Box
                key={incident.id}
                onClick={() => {
                  setSelectedIncidentId(incident.id);
                  setDetailModalOpen(true);
                }}
                sx={{
                  p: 1.5,
                  mb: 1.5,
                  borderRadius: 1,
                  borderLeft: `4px solid ${COLOR_MAP[incident.colorCode || 'YELLOW'] || '#D97706'}`,
                  bgcolor: '#fff',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                  cursor: 'pointer',
                  '&:hover': { bgcolor: '#fefce8' },
                }}
              >
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 0.5 }}>
                  {incident.disasterScope && (
                    <Chip label={incident.disasterScope} size="small" variant="outlined" sx={{ fontSize: '0.6rem', height: 18, mr: 0.5 }} />
                  )}
                  <Chip
                    label={getIncidentTypeLabel(incident.incidentType)}
                    size="small"
                    sx={{ fontSize: '0.65rem', height: 20 }}
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
                </Box>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                  {incident.locationAddress || `${incident.locationLat.toFixed(4)}, ${incident.locationLng.toFixed(4)}`}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  G:{incident.estimatedGreen || 0} Y:{incident.estimatedYellow || 0} R:
                  {incident.estimatedRed || 0} B:{incident.estimatedBlack || 0}
                </Typography>
                {incident.ambulanceAssignments && incident.ambulanceAssignments.length > 0 && (
                  <Box sx={{ mt: 0.5 }}>
                    {incident.incidentType === 'RTA_MCI' ? (
                      ['RED', 'YELLOW', 'GREEN', 'BLACK'].map((cat) => {
                        const list = incident.ambulanceAssignments!.filter(
                          (a) => a.triageCategory === cat || (!a.triageCategory && cat === 'RED')
                        );
                        if (list.length === 0) return null;
                        const parts = list.map(
                          (a) =>
                            `${a.ambulance?.callSign || 'A'}(${a.status})→${a.destinationHospital?.name || '—'}`
                        );
                        return (
                          <Typography key={cat} variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.7rem' }}>
                            {cat}: {parts.join(', ')}
                          </Typography>
                        );
                      })
                    ) : (
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.7rem' }}>
                        {incident.ambulanceAssignments!.map(
                          (a) =>
                            `${a.ambulance?.callSign || 'A'}(${a.status})→${a.destinationHospital?.name || '—'}`
                        ).join(' · ')}
                      </Typography>
                    )}
                  </Box>
                )}
                <DisasterStepsIndicator incident={incident} variant="compact" />
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                  {incident.createdBy?.firstName} {incident.createdBy?.lastName} ·{' '}
                  {new Date(incident.createdAt).toLocaleString()}
                </Typography>
              </Box>
            ))
          )}
        </Box>
      </Drawer>

      <DisasterIncidentDetailModal
        incidentId={selectedIncidentId}
        open={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedIncidentId(null);
        }}
        onResolved={fetchIncidents}
      />
    </>
  );
};

export default DisasterSidebar;
