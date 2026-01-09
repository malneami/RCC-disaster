import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Stack,
  Chip,
  Button,
  alpha,
  useTheme,
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHeartbeat,
  faBrain,
  faHospital,
  faUser,
  faClock,
  faAmbulance,
  faCheckCircle,
} from '@fortawesome/free-solid-svg-icons';
import { ticketService, Ticket } from '../../../services/ticketService';
import EmptyState from '../../../components/Common/EmptyState';
import { useSnackbar } from 'notistack';
import { useAuth } from '../../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface RCCIncomingCasesListProps {
  onCaseAcknowledged?: () => void;
}

const RCCIncomingCasesList: React.FC<RCCIncomingCasesListProps> = ({ onCaseAcknowledged }) => {
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cases, setCases] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acknowledging, setAcknowledging] = useState<string | null>(null);

  const isRCC = user?.role === 'RCC' || user?.role === 'ADMIN';

  useEffect(() => {
    if (isRCC) {
      loadIncomingCases();
      const interval = setInterval(() => {
        if (isRCC) {
          loadIncomingCases();
        }
      }, 30000);
      return () => clearInterval(interval);
    } else {
      setLoading(false);
    }
  }, [isRCC]);

  const loadIncomingCases = async () => {
    if (!isRCC) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await ticketService.getRCCIncomingCases();
      setCases(data);
    } catch (err: any) {
      console.error('Error loading RCC incoming cases:', err);
      setError(err.message || 'Failed to load incoming critical cases');
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (ticketId: string) => {
    try {
      setAcknowledging(ticketId);
      await ticketService.acknowledgeTicket(ticketId);
      enqueueSnackbar('Case acknowledged successfully', { variant: 'success' });
      await loadIncomingCases();
      if (onCaseAcknowledged) {
        onCaseAcknowledged();
      }
    } catch (err: any) {
      console.error('Error acknowledging case:', err);
      enqueueSnackbar(err.message || 'Failed to acknowledge case', { variant: 'error' });
    } finally {
      setAcknowledging(null);
    }
  };

  const getPathwayConfig = (pathway: string) => {
    switch (pathway) {
      case 'STEMI':
        return {
          icon: faHeartbeat,
          color: '#ef4444',
          label: 'STEMI',
        };
      case 'STROKE':
        return {
          icon: faBrain,
          color: '#06b6d4',
          label: 'STROKE',
        };
      default:
        return {
          icon: faHospital,
          color: '#6366f1',
          label: pathway || 'GENERAL',
        };
    }
  };

  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case 'EMERGENCY':
        return { color: '#dc2626', label: 'EMERGENCY' };
      case 'CRITICAL':
        return { color: '#ef4444', label: 'CRITICAL' };
      default:
        return { color: '#f59e0b', label: priority || 'MEDIUM' };
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hr ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  if (!isRCC) {
    return (
      <Alert severity="warning" sx={{ mb: 2 }}>
        You don't have permission to view incoming critical cases.
      </Alert>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  if (cases.length === 0) {
    return (
      <EmptyState
        icon={<FontAwesomeIcon icon={faHospital} size="3x" />}
        title="No Incoming Critical Cases"
        description="There are no critical cases incoming to hospitals in the last 24 hours."
      />
    );
  }

  return (
    <Stack spacing={2}>
      <Alert 
        severity="info" 
        sx={{ 
          mb: 2,
          borderRadius: 2,
          '& .MuiAlert-icon': {
            alignItems: 'center',
          },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FontAwesomeIcon icon={faClock} />
          <Typography variant="body2">
            Showing incoming critical cases from the last <strong>24 hours</strong>
          </Typography>
        </Box>
      </Alert>
      {cases.map((ticket) => {
        const pathwayConfig = getPathwayConfig(ticket.pathway || 'GENERAL');
        const priorityConfig = getPriorityConfig(ticket.priority || 'MEDIUM');
        const patientName = ticket.patient
          ? `${ticket.patient.firstName || ''} ${ticket.patient.lastName || ''}`.trim()
          : 'Unknown Patient';
        const destinationHospital = ticket.destinationHospital?.name || 'Unknown Hospital';
        const originHospital = ticket.originHospital?.name || 'Unknown Hospital';
        const latestAssignment = ticket.emsAssignments?.[0];
        const ambulanceInfo = latestAssignment?.ambulance
          ? `${(latestAssignment.ambulance as any).callSign || latestAssignment.ambulance.unitNumber || 'N/A'} (${(latestAssignment.ambulance as any).plateNumber || 'N/A'})`
          : 'Not assigned';
        const driverName = latestAssignment?.driver
          ? `${latestAssignment.driver.firstName || ''} ${latestAssignment.driver.lastName || ''}`.trim()
          : 'Not assigned';

        return (
          <Card
            key={ticket.id}
            sx={{
              borderRadius: 2,
              border: `1px solid ${alpha(pathwayConfig.color, 0.3)}`,
              boxShadow: `0 2px 8px ${alpha(pathwayConfig.color, 0.1)}`,
              transition: 'all 0.3s ease',
              '&:hover': {
                boxShadow: `0 4px 12px ${alpha(pathwayConfig.color, 0.2)}`,
                transform: 'translateY(-2px)',
              },
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 2,
                      backgroundColor: alpha(pathwayConfig.color, 0.1),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: `2px solid ${pathwayConfig.color}`,
                    }}
                  >
                    <FontAwesomeIcon icon={pathwayConfig.icon} style={{ color: pathwayConfig.color, fontSize: '1.5rem' }} />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, color: pathwayConfig.color }}>
                        {pathwayConfig.label}
                      </Typography>
                      <Chip
                        label={priorityConfig.label}
                        size="small"
                        sx={{
                          backgroundColor: priorityConfig.color,
                          color: '#ffffff',
                          fontWeight: 600,
                          fontSize: '0.7rem',
                          height: 20,
                        }}
                      />
                      {ticket.isEmergency && (
                        <Chip
                          label="EMERGENCY"
                          size="small"
                          sx={{
                            backgroundColor: '#dc2626',
                            color: '#ffffff',
                            fontWeight: 600,
                            fontSize: '0.7rem',
                            height: 20,
                          }}
                        />
                      )}
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Ticket #{ticket.ticketNumber}
                    </Typography>
                  </Box>
                </Box>
                {ticket.acknowledgedAt ? (
                  <Chip
                    icon={<FontAwesomeIcon icon={faCheckCircle} />}
                    label="Acknowledged"
                    color="success"
                    size="small"
                    sx={{ fontWeight: 600 }}
                  />
                ) : (
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => handleAcknowledge(ticket.id)}
                    disabled={acknowledging === ticket.id}
                    sx={{
                      backgroundColor: '#10b981',
                      '&:hover': { backgroundColor: '#059669' },
                      fontWeight: 600,
                      textTransform: 'none',
                    }}
                  >
                    {acknowledging === ticket.id ? <CircularProgress size={16} /> : 'Acknowledge'}
                  </Button>
                )}
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 2 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                    <FontAwesomeIcon icon={faUser} style={{ fontSize: '0.75rem' }} />
                    Patient
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {patientName}
                  </Typography>
                  {(ticket.patient as any)?.nationalId && (
                    <Typography variant="caption" color="text.secondary">
                      ID: {(ticket.patient as any).nationalId}
                    </Typography>
                  )}
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                    <FontAwesomeIcon icon={faHospital} style={{ fontSize: '0.75rem' }} />
                    Destination
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {destinationHospital}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    From: {originHospital}
                  </Typography>
                </Box>

                {latestAssignment && (
                  <>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                        <FontAwesomeIcon icon={faAmbulance} style={{ fontSize: '0.75rem' }} />
                        Ambulance
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {ambulanceInfo}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                        <FontAwesomeIcon icon={faUser} style={{ fontSize: '0.75rem' }} />
                        Driver
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {driverName}
                      </Typography>
                    </Box>
                  </>
                )}
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <FontAwesomeIcon icon={faClock} style={{ fontSize: '0.75rem' }} />
                  Created {formatTime(ticket.createdAt)}
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => navigate(`/tickets/${ticket.id}`)}
                  sx={{ textTransform: 'none' }}
                >
                  View Details
                </Button>
              </Box>
            </CardContent>
          </Card>
        );
      })}
    </Stack>
  );
};

export default RCCIncomingCasesList;

