import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  ArrowBack as ArrowBackIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
} from '@mui/icons-material';
import { useFullscreen } from '../../contexts/FullscreenContext';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { hospitalService, Hospital, CriticalCase, HospitalTicket } from '../../services/hospitalService';
import RelatedTicketsManager from './components/RelatedTicketsManager';
import HospitalCriticalCaseTracker from './components/HospitalCriticalCaseTracker';
import HospitalCoordinatesEditor from './components/HospitalCoordinatesEditor';
import { UnifiedTicket } from './types/tickets';

const HospitalDashboardPage: React.FC = () => {
  const { hospitalId } = useParams<{ hospitalId: string }>();
  const navigate = useNavigate();
  const { isFullscreen, setIsFullscreen } = useFullscreen();
  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [criticalCases, setCriticalCases] = useState<CriticalCase[]>([]);
  const [relatedTickets, setRelatedTickets] = useState<HospitalTicket[]>([]);
  const [transferTickets, setTransferTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (hospitalId) {
      loadHospitalData();
    }
  }, [hospitalId]);

  // Auto-refresh data every 30 seconds
  useEffect(() => {
    if (hospitalId) {
      const interval = setInterval(() => {
        loadHospitalData();
      }, 30000); // Refresh every 30 seconds

      return () => clearInterval(interval);
    }
  }, [hospitalId]);

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

  const loadHospitalData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load hospital data
      const hospitalData = await hospitalService.getHospitalById(hospitalId!);
      setHospital(hospitalData);

      // Load critical cases and tickets
      const [criticalCasesData, transferTicketsData] = await Promise.all([
        hospitalService.getActiveCriticalCases(hospitalId!),
        hospitalService.getTransferTicketsForHospital(hospitalId!),
      ]);

      setCriticalCases(criticalCasesData);
      setRelatedTickets([]); // Empty since transferTickets now includes hospital tickets
      setTransferTickets(Array.isArray(transferTicketsData) ? transferTicketsData : []);
      
    } catch (err) {
      setError('Failed to load hospital data');
      console.error('Error loading hospital data:', err);
    } finally {
      setLoading(false);
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
              <IconButton onClick={loadHospitalData}>
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

        {/* Summary Cards */}
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Critical Cases
                </Typography>
                <Typography variant="h4" color="error.main">
                  {loading ? (
                    <CircularProgress size={24} />
                  ) : (
                    (() => {
                      // Count critical cases from both sources
                      const criticalCasesCount = criticalCases?.filter(c => 
                        c.severity === 'CRITICAL' || c.severity === 'URGENT'
                      ).length || 0;
                      
                      // Count STEMI/Stroke cases from transfer tickets
                      const stemiStrokeCount = transferTickets?.filter(t => 
                        (t.pathway === 'STEMI' || t.pathway === 'STROKE') && 
                        (t.status === 'PENDING' || t.status === 'ASSIGNED' || t.status === 'IN_TRANSPORT')
                      ).length || 0;
                      
                      return criticalCasesCount + stemiStrokeCount;
                    })()
                  )}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Active critical cases
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Open Tickets
                </Typography>
                <Typography variant="h4" color="warning.main">
                  {loading ? (
                    <CircularProgress size={24} />
                  ) : (
                    (() => {
                      // Count open hospital tickets
                      const openHospitalTickets = relatedTickets?.filter(t => 
                        t.status === 'OPEN' || t.status === 'IN_PROGRESS'
                      ).length || 0;
                      
                      // Count open transfer tickets
                      const openTransferTickets = transferTickets?.filter(t => 
                        t.status === 'PENDING' || t.status === 'ASSIGNED' || t.status === 'IN_TRANSPORT'
                      ).length || 0;
                      
                      return openHospitalTickets + openTransferTickets;
                    })()
                  )}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Pending resolution
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Bed Availability
                </Typography>
                <Typography variant="h4" color="primary.main">
                  {loading ? (
                    <CircularProgress size={24} />
                  ) : (
                    hospital ? getAvailabilityPercentage(hospital) : 0
                  )}%
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Current capacity
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Services
                </Typography>
                <Typography variant="h4" color="success.main">
                  {loading ? (
                    <CircularProgress size={24} />
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
                <Typography variant="body2" color="textSecondary">
                  Specialized services
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs */}
        <Paper sx={{ width: '100%' }}>
          <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
            <Tab label="Critical Cases" />
            <Tab label="Related Tickets" />
            <Tab label="Hospital Details" />
          </Tabs>

          {/* Critical Cases Tab */}
          {tabValue === 0 && (
            <Box sx={{ p: 3 }}>
              {/* Real-Time Critical Case Tracker */}
              <Box sx={{ mb: 4 }}>
                <HospitalCriticalCaseTracker hospitalId={hospitalId!} />
              </Box>
            </Box>
          )}

          {/* Related Tickets Tab */}
          {tabValue === 1 && (
            <Box sx={{ p: 3 }}>
              <RelatedTicketsManager
                hospitalTickets={relatedTickets}
                transferTickets={transferTickets}                
                onRefresh={loadHospitalData}
                onViewTicket={handleViewTicket}
                onEditTicket={handleEditTicket}
                isLoading={loading}
              />
            </Box>
          )}

          {/* Hospital Details Tab */}
          {tabValue === 2 && (
            <Box sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Hospital Details
              </Typography>

              {/* Hospital Coordinates Editor */}
              <HospitalCoordinatesEditor 
                hospital={hospital} 
                onHospitalUpdate={handleHospitalUpdate} 
              />

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    Contact Information
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Phone: {hospital.contactPhone || 'Not provided'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Email: {hospital.contactEmail || 'Not provided'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Emergency Dept: {hospital.emergencyDeptStatus || 'Unknown'}
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    Services Available
                  </Typography>
                  <Box display="flex" flexDirection="column" gap={1}>
                    <Chip
                      label="STEMI Service"
                      color={hospital.hasStemiService ? 'success' : 'default'}
                      size="small"
                    />
                    <Chip
                      label="Stroke Service"
                      color={hospital.hasStrokeService ? 'success' : 'default'}
                      size="small"
                    />
                    <Chip
                      label="Trauma Service"
                      color={hospital.hasTraumaService ? 'success' : 'default'}
                      size="small"
                    />
                    <Chip
                      label="Stroke Unit"
                      color={hospital.hasStrokeUnit ? 'success' : 'default'}
                      size="small"
                    />
                    <Chip
                      label="Cardiology Center"
                      color={hospital.hasCardiologyCenter ? 'success' : 'default'}
                      size="small"
                    />
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom>
                    Bed Capacity
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2" color="text.secondary">
                        ICU Beds
                      </Typography>
                      <Typography variant="h6">
                        {hospital.icuBedsAvailable}/{hospital.icuBeds}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2" color="text.secondary">
                        PICU Beds
                      </Typography>
                      <Typography variant="h6">
                        {hospital.picuBedsAvailable}/{hospital.picuBeds}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2" color="text.secondary">
                        NICU Beds
                      </Typography>
                      <Typography variant="h6">
                        {hospital.nicuBedsAvailable}/{hospital.nicuBeds}
                      </Typography>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </Box>
          )}
        </Paper>
      </Box>
    </>
  );
};

export default HospitalDashboardPage;
