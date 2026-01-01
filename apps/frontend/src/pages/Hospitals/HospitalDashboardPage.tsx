import React, { useState } from 'react';
import {
  Box,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Paper,
  Button,
  alpha,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import {
  shadows,
  spacing,
} from './styles/hospitalDashboardTokens';
import { useFullscreen } from '../../contexts/FullscreenContext';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import RelatedTicketsManager from './components/RelatedTicketsManager';
import HospitalCriticalCaseTracker from './components/HospitalCriticalCaseTracker';
// import HospitalCoordinatesEditor from './components/HospitalCoordinatesEditor'; // Removed as it's now in HospitalDetailsTab
import HospitalBedsTab from './components/HospitalBedsTab';
import { UnifiedTicket } from './types/tickets';
import { useHospitalData } from './hooks/useHospitalData';
import { DashboardHeader } from './components/DashboardHeader';
import { DashboardSummaryCards } from './components/DashboardSummaryCards';
import { HospitalDetailsTab } from './components/HospitalDetailsTab';


const HospitalDashboardPage: React.FC = () => {
  const { hospitalId } = useParams<{ hospitalId: string }>();
  const navigate = useNavigate();
  const { isFullscreen } = useFullscreen();
  const [tabValue, setTabValue] = useState(0);

  const {
    hospital,
    criticalCases,
    relatedTickets,
    transferTickets,
    loading,
    error,
    loadHospitalData,
    setHospital,
  } = useHospitalData(hospitalId);

  const handleViewTicket = (ticket: UnifiedTicket) => {
    if (ticket.type === 'TRANSFER') {
      navigate(`/tickets/${ticket.id}`);
    } else {
      console.log('View hospital ticket:', ticket.id);
    }
  };

  const handleEditTicket = (ticket: UnifiedTicket) => {
    if (ticket.type === 'TRANSFER') {
      navigate(`/tickets/${ticket.id}/edit`);
    } else {
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
        <DashboardHeader
          hospital={hospital}
          onRefresh={() => loadHospitalData(false)}
        />

        <DashboardSummaryCards
          hospital={hospital}
          loading={loading}
          criticalCases={criticalCases}
          relatedTickets={relatedTickets}
          transferTickets={transferTickets}
        />

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
            <HospitalDetailsTab
              hospital={hospital}
              onHospitalUpdate={setHospital}
            />
          )}

          {/* Hospital Beds Tab */}
          {tabValue === 3 && (
            <Box sx={{ p: { xs: 2, md: 4 }, backgroundColor: '#FAFBFC' }}>
              <HospitalBedsTab
                hospitalId={hospitalId!}
              />
            </Box>
          )}
        </Paper>
      </Box>
    </>
  );
};

export default HospitalDashboardPage;
