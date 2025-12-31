import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from 'react-query';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Paper,
  IconButton,
  Tooltip,
  Breadcrumbs,
  Link,
  Button,
  alpha,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  ArrowBack as ArrowBackIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
} from '@mui/icons-material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faExclamationTriangle,
  faTicketAlt,
  faBed,
  faMedkit,
} from '@fortawesome/free-solid-svg-icons';
import {
  skyBlue,
  shadows,
  spacing,
} from './styles/hospitalDashboardTokens';
import { useFullscreen } from '../../contexts/FullscreenContext';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { hospitalService, Hospital, CriticalCase, HospitalTicket } from '../../services/hospitalService';
import RelatedTicketsManager from './components/RelatedTicketsManager';
import HospitalCriticalCaseTracker from './components/HospitalCriticalCaseTracker';
import HospitalCoordinatesEditor from './components/HospitalCoordinatesEditor';
import HospitalBedsTab from './components/HospitalBedsTab';
import { UnifiedTicket } from './types/tickets';

const HospitalDashboardPage: React.FC = () => {
  const { hospitalId } = useParams<{ hospitalId: string }>();
  const navigate = useNavigate();
  const { isFullscreen, setIsFullscreen } = useFullscreen();
  const queryClient = useQueryClient();
  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [criticalCases, setCriticalCases] = useState<CriticalCase[]>([]);
  const [relatedTickets, setRelatedTickets] = useState<HospitalTicket[]>([]);
  const [transferTickets, setTransferTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedRef = useRef(false);

  const [bedFilters, setBedFilters] = useState<{
    hospitalId?: string;
    unitId: string;
    status: string;
  }>({
    unitId: '',
    status: '',
  });

  const loadHospitalData = useCallback(async (isInitialLoad = false) => {
    if (!hospitalId) return;

    const shouldShowLoading = isInitialLoad || !hasLoadedRef.current;

    try {
      if (shouldShowLoading) {
        setLoading(true);
      }
      setError(null);

      const hospitalData = await hospitalService.getHospitalById(hospitalId);
      setHospital(hospitalData);

      const [criticalCasesData, transferTicketsData] = await Promise.all([
        hospitalService.getActiveCriticalCases(hospitalId),
        hospitalService.getTransferTicketsForHospital(hospitalId),
      ]);

      setCriticalCases(criticalCasesData);
      setRelatedTickets([]);
      setTransferTickets(Array.isArray(transferTicketsData) ? transferTicketsData : []);

      // Refetch beds data using React Query
      queryClient.invalidateQueries(['beds', hospitalId]);

      hasLoadedRef.current = true;
    } catch (err) {
      setError('Failed to load hospital data');
      console.error('Error loading hospital data:', err);
    } finally {
      if (shouldShowLoading) {
        setLoading(false);
      }
    }
  }, [hospitalId, queryClient]);

  useEffect(() => {
    if (hospitalId) {
      hasLoadedRef.current = false;
      loadHospitalData(true);
      setBedFilters({
        unitId: '',
        status: '',
      });
    }
  }, [hospitalId, loadHospitalData]);

  // Auto-refresh data every 30 seconds
  useEffect(() => {
    if (hospitalId) {
      const interval = setInterval(() => {
        loadHospitalData(false);
      }, 30000); // Refresh every 30 seconds

      return () => clearInterval(interval);
    }
  }, [hospitalId, loadHospitalData]);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, [setIsFullscreen]);

  const handleFullscreenToggle = async () => {
    try {
      if (!isFullscreen) {
        const element = document.documentElement;
        if (element.requestFullscreen) {
          await element.requestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
      }
    } catch (error) {
      console.error('Error toggling fullscreen:', error);
    }
  };

  const handleHospitalUpdate = (updatedHospital: Hospital) => {
    setHospital(updatedHospital);
  };

  const getAvailabilityPercentage = (hospital: Hospital) => {
    const totalBeds = (hospital.icuBeds || 0) + (hospital.picuBeds || 0) +
      (hospital.maleBeds || 0) + (hospital.femaleBeds || 0) +
      (hospital.pediatricBeds || 0) + (hospital.standardBeds || 0) +
      (hospital.nicuBeds || 0);
    const availableBeds = (hospital.icuBedsAvailable || 0) + (hospital.picuBedsAvailable || 0) +
      (hospital.maleBedsAvailable || 0) + (hospital.femaleBedsAvailable || 0) +
      (hospital.pediatricBedsAvailable || 0) + (hospital.standardBedsAvailable || 0) +
      (hospital.nicuBedsAvailable || 0);
    return totalBeds > 0 ? Math.round((availableBeds / totalBeds) * 100) : 0;
  };

  const handleViewTicket = (ticket: UnifiedTicket) => {
    if (ticket.type === 'TRANSFER') {
      navigate(`/tickets/${ticket.id}`);
    } else {
      // For hospital tickets, you might want to create a different view
      console.log('View hospital ticket:', ticket.id);
    }
  };

  const handleEditTicket = (ticket: UnifiedTicket) => {
    if (ticket.type === 'TRANSFER') {
      navigate(`/tickets/${ticket.id}/edit`);
    } else {
      // For hospital tickets, you might want to create a different edit flow
      console.log('Edit hospital ticket:', ticket.id);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !hospital) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || 'Hospital not found'}
        </Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/hospitals')}
        >
          Back to Hospitals
        </Button>
      </Box>
    );
  }

  return (
    <>
      <Helmet>
        <title>{hospital.name} - Hospital Dashboard - RCC Healthcare</title>
      </Helmet>

      <Box sx={{ p: isFullscreen ? 0 : 3 }}>
        {/* Breadcrumbs */}
        <Breadcrumbs sx={{ mb: 3, display: isFullscreen ? 'none' : 'flex' }}>
          <Link
            color="inherit"
            href="/hospitals"
            onClick={e => {
              e.preventDefault();
              navigate('/hospitals');
            }}
            sx={{ cursor: 'pointer' }}
          >
            Hospitals
          </Link>
          <Typography color="text.primary">{hospital.name}</Typography>
        </Breadcrumbs>

        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              {hospital.name}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {hospital.address || 'No address provided'}
            </Typography>
            <Box display="flex" gap={1} mt={1}>
              <Chip label={hospital.status} color="primary" size="small" />
              <Chip
                label={`${getAvailabilityPercentage(hospital)}% Available`}
                color={
                  getAvailabilityPercentage(hospital) <= 10
                    ? 'error'
                    : getAvailabilityPercentage(hospital) <= 25
                      ? 'warning'
                      : 'success'
                }
                size="small"
              />
              <Chip label={hospital.cluster} variant="outlined" size="small" />
            </Box>
          </Box>
          <Box>
            <Tooltip title="Refresh Data">
              <IconButton onClick={() => loadHospitalData(false)}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}>
              <IconButton onClick={handleFullscreenToggle}>
                {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
              </IconButton>
            </Tooltip>
            {!isFullscreen && (
              <Tooltip title="Back to Hospitals">
                <IconButton onClick={() => navigate('/hospitals')}>
                  <ArrowBackIcon />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>

        {/* Summary Cards - Unified Sky Blue Theme */}
        <Grid container spacing={3} mb={4}>
          {/* Critical Cases Card */}
          <Grid item xs={12} sm={6} md={3}>
            <Card
              elevation={0}
              sx={{
                backgroundColor: skyBlue[50],
                borderRadius: spacing.borderRadius.lg,
                border: `1px solid ${skyBlue[100]}`,
                boxShadow: shadows.card,
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  boxShadow: shadows.cardHover,
                  transform: 'translateY(-2px)',
                },
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: spacing.borderRadius.md,
                      backgroundColor: alpha(skyBlue[600], 0.15),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <FontAwesomeIcon icon={faExclamationTriangle} style={{ fontSize: 22, color: skyBlue[700] }} />
                  </Box>
                </Box>
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 700,
                    color: skyBlue[600],
                    fontSize: '2.5rem',
                    lineHeight: 1,
                    mb: 1,
                  }}
                >
                  {loading ? (
                    <CircularProgress size={32} sx={{ color: skyBlue[600] }} />
                  ) : (
                    (() => {
                      const criticalCasesCount = criticalCases?.filter(c =>
                        c.severity === 'CRITICAL' || c.severity === 'URGENT'
                      ).length || 0;
                      const stemiStrokeCount = transferTickets?.filter(t =>
                        (t.pathway === 'STEMI' || t.pathway === 'STROKE') &&
                        (t.status === 'PENDING' || t.status === 'ASSIGNED' || t.status === 'IN_TRANSPORT')
                      ).length || 0;
                      return criticalCasesCount + stemiStrokeCount;
                    })()
                  )}
                </Typography>
                <Typography
                  sx={{
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: '#64748B',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Critical Cases
                </Typography>
                <Typography sx={{ fontSize: '0.75rem', color: '#94A3B8', mt: 0.5 }}>
                  Active critical cases
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Open Tickets Card */}
          <Grid item xs={12} sm={6} md={3}>
            <Card
              elevation={0}
              sx={{
                backgroundColor: skyBlue[50],
                borderRadius: spacing.borderRadius.lg,
                border: `1px solid ${skyBlue[100]}`,
                boxShadow: shadows.card,
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  boxShadow: shadows.cardHover,
                  transform: 'translateY(-2px)',
                },
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: spacing.borderRadius.md,
                      backgroundColor: alpha(skyBlue[600], 0.15),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <FontAwesomeIcon icon={faTicketAlt} style={{ fontSize: 22, color: skyBlue[700] }} />
                  </Box>
                </Box>
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 700,
                    color: skyBlue[600],
                    fontSize: '2.5rem',
                    lineHeight: 1,
                    mb: 1,
                  }}
                >
                  {loading ? (
                    <CircularProgress size={32} sx={{ color: skyBlue[600] }} />
                  ) : (
                    (() => {
                      const openHospitalTickets = relatedTickets?.filter(t =>
                        t.status === 'OPEN' || t.status === 'IN_PROGRESS'
                      ).length || 0;
                      const openTransferTickets = transferTickets?.filter(t =>
                        t.status === 'PENDING' || t.status === 'ASSIGNED' || t.status === 'IN_TRANSPORT'
                      ).length || 0;
                      return openHospitalTickets + openTransferTickets;
                    })()
                  )}
                </Typography>
                <Typography
                  sx={{
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: '#64748B',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Open Tickets
                </Typography>
                <Typography sx={{ fontSize: '0.75rem', color: '#94A3B8', mt: 0.5 }}>
                  Pending resolution
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Bed Availability Card */}
          <Grid item xs={12} sm={6} md={3}>
            <Card
              elevation={0}
              sx={{
                backgroundColor: skyBlue[50],
                borderRadius: spacing.borderRadius.lg,
                border: `1px solid ${skyBlue[100]}`,
                boxShadow: shadows.card,
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  boxShadow: shadows.cardHover,
                  transform: 'translateY(-2px)',
                },
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: spacing.borderRadius.md,
                      backgroundColor: alpha(skyBlue[600], 0.15),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <FontAwesomeIcon icon={faBed} style={{ fontSize: 22, color: skyBlue[700] }} />
                  </Box>
                </Box>
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 700,
                    color: skyBlue[600],
                    fontSize: '2.5rem',
                    lineHeight: 1,
                    mb: 1,
                  }}
                >
                  {loading ? (
                    <CircularProgress size={32} sx={{ color: skyBlue[600] }} />
                  ) : (
                    `${hospital ? getAvailabilityPercentage(hospital) : 0}%`
                  )}
                </Typography>
                <Typography
                  sx={{
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: '#64748B',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Bed Availability
                </Typography>
                <Typography sx={{ fontSize: '0.75rem', color: '#94A3B8', mt: 0.5 }}>
                  Current capacity
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Services Card */}
          <Grid item xs={12} sm={6} md={3}>
            <Card
              elevation={0}
              sx={{
                backgroundColor: skyBlue[50],
                borderRadius: spacing.borderRadius.lg,
                border: `1px solid ${skyBlue[100]}`,
                boxShadow: shadows.card,
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  boxShadow: shadows.cardHover,
                  transform: 'translateY(-2px)',
                },
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: spacing.borderRadius.md,
                      backgroundColor: alpha(skyBlue[600], 0.15),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <FontAwesomeIcon icon={faMedkit} style={{ fontSize: 22, color: skyBlue[700] }} />
                  </Box>
                </Box>
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 700,
                    color: skyBlue[600],
                    fontSize: '2.5rem',
                    lineHeight: 1,
                    mb: 1,
                  }}
                >
                  {loading ? (
                    <CircularProgress size={32} sx={{ color: skyBlue[600] }} />
                  ) : (
                    hospital ? [
                      hospital.hasStemiService,
                      hospital.hasStrokeService,
                      hospital.hasTraumaService,
                      hospital.hasThrombolysis,
                      hospital.hasThrombectomy,
                      hospital.hasStrokeUnit,
                      hospital.hasCardiologyCenter,
                    ].filter(Boolean).length : 0
                  )}
                </Typography>
                <Typography
                  sx={{
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: '#64748B',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Services
                </Typography>
                <Typography sx={{ fontSize: '0.75rem', color: '#94A3B8', mt: 0.5 }}>
                  Specialized services
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs - Segmented Control Style */}
        <Paper
          elevation={0}
          sx={{
            width: '100%',
            borderRadius: spacing.borderRadius.lg,
            overflow: 'hidden',
            boxShadow: shadows.elevated,
            border: '1px solid rgba(0, 0, 0, 0.04)',
          }}
        >
          <Box
            sx={{
              backgroundColor: '#F8FAFC',
              p: 1.5,
              borderBottom: '1px solid #E2E8F0',
            }}
          >
            <Tabs
              value={tabValue}
              onChange={(_, newValue) => setTabValue(newValue)}
              sx={{
                minHeight: 'auto',
                '& .MuiTabs-indicator': {
                  display: 'none',
                },
                '& .MuiTabs-flexContainer': {
                  gap: '8px',
                },
              }}
            >
              {['Critical Cases', 'Related Tickets', 'Hospital Details', 'Hospital Beds'].map((label, index) => (
                <Tab
                  key={label}
                  label={label}
                  sx={{
                    minHeight: '44px',
                    padding: '8px 20px',
                    borderRadius: spacing.borderRadius.md,
                    textTransform: 'none',
                    fontSize: '0.875rem',
                    fontWeight: tabValue === index ? 700 : 500,
                    color: tabValue === index ? '#0F172A' : '#64748B',
                    backgroundColor: tabValue === index ? '#FFFFFF' : 'transparent',
                    boxShadow: tabValue === index ? shadows.tabActive : 'none',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      backgroundColor: tabValue === index ? '#FFFFFF' : alpha('#FFFFFF', 0.5),
                    },
                  }}
                />
              ))}
            </Tabs>
          </Box>

          {/* Critical Cases Tab */}
          {tabValue === 0 && (
            <Box sx={{ p: { xs: 2, md: 4 }, backgroundColor: '#FAFBFC' }}>
              {/* Real-Time Critical Case Tracker */}
              <Box sx={{ mb: 4 }}>
                <HospitalCriticalCaseTracker hospitalId={hospitalId!} />
              </Box>
            </Box>
          )}

          {/* Related Tickets Tab */}
          {tabValue === 1 && (
            <Box sx={{ p: { xs: 2, md: 4 }, backgroundColor: '#FAFBFC' }}>
              <RelatedTicketsManager
                hospitalTickets={relatedTickets}
                transferTickets={transferTickets}
                onRefresh={() => loadHospitalData(false)}
                onViewTicket={handleViewTicket}
                onEditTicket={handleEditTicket}
                isLoading={loading}
              />
            </Box>
          )}

          {/* Hospital Details Tab */}
          {tabValue === 2 && (
            <Box sx={{ p: { xs: 2, md: 4 }, backgroundColor: '#FAFBFC' }}>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 600,
                  color: '#0F172A',
                  mb: 3,
                }}
              >
                Hospital Details
              </Typography>

              {/* Hospital Coordinates Editor */}
              <HospitalCoordinatesEditor
                hospital={hospital}
                onHospitalUpdate={handleHospitalUpdate}
              />

              <Grid container spacing={3}>
                {/* Contact Information Card */}
                <Grid item xs={12} md={6}>
                  <Card
                    elevation={0}
                    sx={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: spacing.borderRadius.lg,
                      boxShadow: shadows.elevated,
                      border: '1px solid rgba(0, 0, 0, 0.04)',
                      p: 3,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                      <Box
                        sx={{
                          width: 44,
                          height: 44,
                          borderRadius: '10px',
                          backgroundColor: alpha('#0284C7', 0.1),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mr: 2,
                        }}
                      >
                        <FontAwesomeIcon icon={faTicketAlt} style={{ color: '#0284C7', fontSize: 20 }} />
                      </Box>
                      <Typography
                        variant="subtitle1"
                        sx={{ fontWeight: 700, color: '#0F172A' }}
                      >
                        Contact Information
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {/* Phone */}
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          p: 2,
                          backgroundColor: '#F0F9FF',
                          borderRadius: '12px',
                          border: '1px solid #E0F2FE',
                        }}
                      >
                        <Box
                          sx={{
                            width: 36,
                            height: 36,
                            borderRadius: '8px',
                            backgroundColor: '#FFFFFF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mr: 2,
                            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                          }}
                        >
                          <FontAwesomeIcon icon={faExclamationTriangle} style={{ color: '#10B981', fontSize: 16 }} />
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 500 }}>Phone</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A' }}>
                            {hospital.contactPhone || 'Not provided'}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Email */}
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          p: 2,
                          backgroundColor: '#F0FDF4',
                          borderRadius: '12px',
                          border: '1px solid #D1FAE5',
                        }}
                      >
                        <Box
                          sx={{
                            width: 36,
                            height: 36,
                            borderRadius: '8px',
                            backgroundColor: '#FFFFFF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mr: 2,
                            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                          }}
                        >
                          <FontAwesomeIcon icon={faMedkit} style={{ color: '#0284C7', fontSize: 16 }} />
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 500 }}>Email</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A' }}>
                            {hospital.contactEmail || 'Not provided'}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Emergency Dept */}
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          p: 2,
                          backgroundColor: hospital.emergencyDeptStatus === 'available' ? '#F0FDF4' : '#FEF2F2',
                          borderRadius: '12px',
                          border: `1px solid ${hospital.emergencyDeptStatus === 'available' ? '#D1FAE5' : '#FECACA'}`,
                        }}
                      >
                        <Box
                          sx={{
                            width: 36,
                            height: 36,
                            borderRadius: '8px',
                            backgroundColor: '#FFFFFF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mr: 2,
                            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                          }}
                        >
                          <FontAwesomeIcon
                            icon={faBed}
                            style={{
                              color: hospital.emergencyDeptStatus === 'available' ? '#10B981' : '#DC2626',
                              fontSize: 16
                            }}
                          />
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 500 }}>Emergency Dept</Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 600,
                              color: hospital.emergencyDeptStatus === 'available' ? '#059669' : '#DC2626',
                            }}
                          >
                            {hospital.emergencyDeptStatus || 'Unknown'}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Card>
                </Grid>

                {/* Services Card */}
                <Grid item xs={12} md={6}>
                  <Card
                    elevation={0}
                    sx={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: spacing.borderRadius.lg,
                      boxShadow: shadows.elevated,
                      border: '1px solid rgba(0, 0, 0, 0.04)',
                      p: 3,
                    }}
                  >
                    <Typography
                      variant="subtitle1"
                      sx={{ fontWeight: 600, color: '#0F172A', mb: 2 }}
                    >
                      Services Available
                    </Typography>
                    <Box display="flex" flexWrap="wrap" gap={1}>
                      <Chip
                        label="STEMI Service"
                        sx={{
                          backgroundColor: hospital.hasStemiService ? '#D1FAE5' : '#F1F5F9',
                          color: hospital.hasStemiService ? '#059669' : '#64748B',
                          fontWeight: 600,
                          borderRadius: '16px',
                        }}
                        size="small"
                      />
                      <Chip
                        label="Stroke Service"
                        sx={{
                          backgroundColor: hospital.hasStrokeService ? '#D1FAE5' : '#F1F5F9',
                          color: hospital.hasStrokeService ? '#059669' : '#64748B',
                          fontWeight: 600,
                          borderRadius: '16px',
                        }}
                        size="small"
                      />
                      <Chip
                        label="Trauma Service"
                        sx={{
                          backgroundColor: hospital.hasTraumaService ? '#D1FAE5' : '#F1F5F9',
                          color: hospital.hasTraumaService ? '#059669' : '#64748B',
                          fontWeight: 600,
                          borderRadius: '16px',
                        }}
                        size="small"
                      />
                      <Chip
                        label="Stroke Unit"
                        sx={{
                          backgroundColor: hospital.hasStrokeUnit ? '#D1FAE5' : '#F1F5F9',
                          color: hospital.hasStrokeUnit ? '#059669' : '#64748B',
                          fontWeight: 600,
                          borderRadius: '16px',
                        }}
                        size="small"
                      />
                      <Chip
                        label="Cardiology Center"
                        sx={{
                          backgroundColor: hospital.hasCardiologyCenter ? '#D1FAE5' : '#F1F5F9',
                          color: hospital.hasCardiologyCenter ? '#059669' : '#64748B',
                          fontWeight: 600,
                          borderRadius: '16px',
                        }}
                        size="small"
                      />
                    </Box>
                  </Card>
                </Grid>

                {/* Bed Capacity Card */}
                <Grid item xs={12}>
                  <Card
                    elevation={0}
                    sx={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: spacing.borderRadius.lg,
                      boxShadow: shadows.elevated,
                      border: '1px solid rgba(0, 0, 0, 0.04)',
                      p: 3,
                    }}
                  >
                    <Typography
                      variant="subtitle1"
                      sx={{ fontWeight: 600, color: '#0F172A', mb: 3 }}
                    >
                      Bed Capacity
                    </Typography>
                    <Grid container spacing={3}>
                      <Grid item xs={6} sm={4} md={2}>
                        <Box
                          sx={{
                            textAlign: 'center',
                            p: 2,
                            backgroundColor: skyBlue[50],
                            borderRadius: spacing.borderRadius.md,
                          }}
                        >
                          <Typography variant="body2" color="#64748B" sx={{ mb: 1 }}>ICU Beds</Typography>
                          <Typography variant="h5" sx={{ fontWeight: 700, color: skyBlue[600] }}>
                            {hospital.icuBedsAvailable}/{hospital.icuBeds}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6} sm={4} md={2}>
                        <Box
                          sx={{
                            textAlign: 'center',
                            p: 2,
                            backgroundColor: skyBlue[50],
                            borderRadius: spacing.borderRadius.md,
                          }}
                        >
                          <Typography variant="body2" color="#64748B" sx={{ mb: 1 }}>PICU Beds</Typography>
                          <Typography variant="h5" sx={{ fontWeight: 700, color: skyBlue[600] }}>
                            {hospital.picuBedsAvailable}/{hospital.picuBeds}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6} sm={4} md={2}>
                        <Box
                          sx={{
                            textAlign: 'center',
                            p: 2,
                            backgroundColor: skyBlue[50],
                            borderRadius: spacing.borderRadius.md,
                          }}
                        >
                          <Typography variant="body2" color="#64748B" sx={{ mb: 1 }}>NICU Beds</Typography>
                          <Typography variant="h5" sx={{ fontWeight: 700, color: skyBlue[600] }}>
                            {hospital.nicuBedsAvailable}/{hospital.nicuBeds}
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Hospital Beds Tab */}
          {tabValue === 3 && (
            <Box sx={{ p: { xs: 2, md: 4 }, backgroundColor: '#FAFBFC' }}>
              <HospitalBedsTab
                hospitalId={hospitalId!}
                filters={bedFilters}
                onFiltersChange={setBedFilters}
              />
            </Box>
          )}
        </Paper>
      </Box>
    </>
  );
};

export default HospitalDashboardPage;
