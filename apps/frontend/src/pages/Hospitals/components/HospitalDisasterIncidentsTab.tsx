import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle, faExternalLinkAlt, faAmbulance, faHospital } from '@fortawesome/free-solid-svg-icons';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { disasterService } from '../../../services/disasterService';
import type { DisasterIncident } from '../../../services/disasterService';
import { getIncidentTypeLabel } from '../../../services/disasterService';

const COLOR_MAP: Record<string, string> = {
  RED: '#DC2626',
  YELLOW: '#D97706',
  GREEN: '#059669',
  BLACK: '#374151',
};

interface HospitalDisasterIncidentsTabProps {
  hospitalId: string;
  hospitalName: string;
}

const HospitalDisasterIncidentsTab: React.FC<HospitalDisasterIncidentsTabProps> = ({
  hospitalId,
  hospitalName,
}) => {
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState<DisasterIncident[]>([]);
  const [loading, setLoading] = useState(true);

  const loadIncidents = useCallback(async () => {
    setLoading(true);
    try {
      const data = await disasterService.getActiveIncidents();
      const filtered = data.filter(
        (inc) =>
          (inc.ambulanceAssignments || []).some(
            (a) => a.destinationHospital?.id === hospitalId
          )
      );
      setIncidents(filtered);
    } catch (err) {
      console.error('Failed to fetch disaster incidents:', err);
      setIncidents([]);
    } finally {
      setLoading(false);
    }
  }, [hospitalId]);

  useEffect(() => {
    loadIncidents();
  }, [loadIncidents]);

  const handleViewDisasterManagement = () => {
    navigate('/disaster-management');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (incidents.length === 0) {
    return (
      <Box sx={{ p: { xs: 2, md: 4 }, backgroundColor: '#FAFBFC' }}>
        <Paper
          elevation={0}
          sx={{
            p: 6,
            textAlign: 'center',
            borderRadius: 3,
            border: '1px solid rgba(0,0,0,0.08)',
          }}
        >
          <FontAwesomeIcon
            icon={faExclamationTriangle}
            style={{ fontSize: 48, color: 'rgba(0,0,0,0.26)', marginBottom: 8 }}
          />
          <Typography color="text.secondary">
            No disaster incidents assigned to {hospitalName}
          </Typography>
          <Button
            variant="outlined"
            size="small"
            startIcon={<FontAwesomeIcon icon={faExternalLinkAlt} />}
            onClick={handleViewDisasterManagement}
            sx={{ mt: 2 }}
          >
            View in Disaster Management
          </Button>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, backgroundColor: '#FAFBFC' }}>
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="subtitle1" color="text.secondary">
          {incidents.length} incident{incidents.length !== 1 ? 's' : ''} assigned to this hospital
        </Typography>
        <Button
          variant="outlined"
          size="small"
          startIcon={<FontAwesomeIcon icon={faExternalLinkAlt} />}
          onClick={handleViewDisasterManagement}
        >
          View in Disaster Management
        </Button>
      </Box>
      <Grid container spacing={2}>
        {incidents.map((inc) => {
          const assignmentsToThisHospital = (inc.ambulanceAssignments || []).filter(
            (a) => a.destinationHospital?.id === hospitalId
          );
          return (
            <Grid item xs={12} sm={6} md={4} key={inc.id}>
              <Card
                sx={{
                  borderLeft: `4px solid ${COLOR_MAP[inc.colorCode || 'YELLOW'] || '#D97706'}`,
                  cursor: 'pointer',
                }}
                onClick={handleViewDisasterManagement}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', gap: 0.5, mb: 0.5 }}>
                    <Chip label={inc.disasterScope ? `[${inc.disasterScope}] ${getIncidentTypeLabel(inc.incidentType)}` : getIncidentTypeLabel(inc.incidentType)} size="small" sx={{ fontSize: '0.65rem', height: 20 }} />
                    {inc.colorCode && (
                      <Chip
                        label={inc.colorCode}
                        size="small"
                        sx={{
                          fontSize: '0.65rem',
                          height: 20,
                          bgcolor: COLOR_MAP[inc.colorCode],
                          color: '#fff',
                        }}
                      />
                    )}
                  </Box>
                  <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
                    {inc.locationAddress ||
                      `${inc.locationLat?.toFixed(4)}, ${inc.locationLng?.toFixed(4)}`}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    {inc.createdAt
                      ? format(new Date(inc.createdAt), 'dd/MM/yyyy HH:mm')
                      : '—'}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                    {[
                      { key: 'G', cat: 'GREEN', count: inc.estimatedGreen ?? 0 },
                      { key: 'Y', cat: 'YELLOW', count: inc.estimatedYellow ?? 0 },
                      { key: 'R', cat: 'RED', count: inc.estimatedRed ?? 0 },
                      { key: 'B', cat: 'BLACK', count: inc.estimatedBlack ?? 0 },
                    ].map(({ key, cat, count }) => (
                      <Typography
                        key={cat}
                        variant="caption"
                        component="span"
                        sx={{ color: COLOR_MAP[cat], fontWeight: 600 }}
                      >
                        {key}:{count}
                      </Typography>
                    ))}
                  </Box>
                  <Box sx={{ mt: 0.75, pt: 0.75, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                    <Typography
                      variant="caption"
                      fontWeight={600}
                      color="text.secondary"
                      sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.25 }}
                    >
                      <FontAwesomeIcon icon={faAmbulance} style={{ fontSize: 10 }} />
                      {assignmentsToThisHospital.length} ambulance(s) → {hospitalName}
                    </Typography>
                    {assignmentsToThisHospital.map((a) => (
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
                            <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.25 }}>
                              <FontAwesomeIcon icon={faHospital} style={{ fontSize: 9 }} />
                              {a.destinationHospital.name}
                            </Box>
                          </>
                        )}
                      </Typography>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};

export default HospitalDisasterIncidentsTab;
